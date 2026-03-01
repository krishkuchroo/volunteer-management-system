const db = require('../config/database');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { hashPassword } = require('../utils/password');
const { logActivity } = require('../middleware/logger');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { getCached, invalidatePattern, invalidateCache } = require('../config/redis');

async function getAllUsers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { role, isActive } = req.query;
    const isActiveParsed =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    const cacheKey = `admin:users:${page}:${limit}:${role || 'all'}:${isActive || 'all'}`;
    const data = await getCached(cacheKey, async () => {
      const { users, total } = await User.findAll({
        role: role || null,
        isActive: isActiveParsed,
        limit,
        offset,
      });
      return { users, pagination: buildPaginationMeta(page, limit, total) };
    }, 300);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  const client = await db.getClient();
  try {
    const { email, password, firstName, lastName, role, isVerified = false, phone } = req.body;
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, first_name, last_name, is_verified, created_at`,
      [email, passwordHash, role, firstName, lastName, phone || null, isVerified]
    );
    const user = result.rows[0];

    if (role === 'volunteer') {
      await client.query('INSERT INTO volunteer_profiles (user_id) VALUES ($1)', [user.id]);
    }

    await client.query('COMMIT');
    await logActivity(req.user.userId, 'ADMIN_CREATE_USER', 'users', user.id, req, 'success');
    await invalidatePattern('admin:users:*');
    await invalidateCache('admin:stats');

    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await User.delete(id);
    await logActivity(req.user.userId, 'ADMIN_DELETE_USER', 'users', parseInt(id), req, 'success');
    await invalidatePattern('admin:users:*');
    await invalidateCache('admin:stats');

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function toggleUserActive(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await User.setActive(id, !user.is_active);
    await logActivity(
      req.user.userId,
      user.is_active ? 'ADMIN_DEACTIVATE_USER' : 'ADMIN_ACTIVATE_USER',
      'users',
      parseInt(id),
      req,
      'success'
    );
    await invalidatePattern('admin:users:*');
    await invalidateCache('admin:stats');

    res.json({ success: true, message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully` });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { userId, action, startDate, endDate } = req.query;

    const { logs, total } = await ActivityLog.findAll({
      userId: userId ? parseInt(userId) : null,
      action: action || null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: { logs, pagination: buildPaginationMeta(page, limit, total) },
    });
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const data = await getCached('admin:stats', async () => {
    const [userStats, bgStats, hoursStats] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE role = 'volunteer') as total_volunteers,
          COUNT(*) FILTER (WHERE role = 'coordinator') as total_coordinators,
          COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
          COUNT(*) as total_users
        FROM users WHERE is_active = true
      `),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE background_check_status = 'pending') as pending,
          COUNT(*) FILTER (WHERE background_check_status = 'approved') as approved,
          COUNT(*) FILTER (WHERE background_check_status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE background_check_status = 'rejected') as rejected
        FROM volunteer_profiles
      `),
      db.query(`
        SELECT
          COALESCE(SUM(hours), 0) as total_hours,
          COALESCE(SUM(hours) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE)), 0) as hours_this_month
        FROM volunteer_hours
      `),
    ]);

    const u = userStats.rows[0];
    const b = bgStats.rows[0];
    const h = hoursStats.rows[0];
    return {
        totalUsers: parseInt(u.total_users),
        totalVolunteers: parseInt(u.total_volunteers),
        totalCoordinators: parseInt(u.total_coordinators),
        totalAdmins: parseInt(u.total_admins),
        pendingBackgroundChecks: parseInt(b.pending),
        approvedBackgroundChecks: parseInt(b.approved),
        inProgressBackgroundChecks: parseInt(b.in_progress),
        rejectedBackgroundChecks: parseInt(b.rejected),
        totalHoursLogged: parseFloat(h.total_hours),
        hoursThisMonth: parseFloat(h.hours_this_month),
      };
    }, 120);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSecurityAlerts(req, res, next) {
  try {
    const { resolved, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT sa.*, u.first_name || ' ' || u.last_name as resolved_by_name
      FROM security_alerts sa
      LEFT JOIN users u ON sa.resolved_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (resolved !== undefined) {
      query += ` AND sa.resolved = $${i++}`;
      params.push(resolved === 'true');
    }
    query += ` ORDER BY sa.created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query(
      'SELECT COUNT(*) FROM security_alerts WHERE resolved = false'
    );

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        unresolvedCount: parseInt(countResult.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function resolveSecurityAlert(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE security_alerts
       SET resolved = true, resolved_by = $1, resolved_at = NOW()
       WHERE id = $2 AND resolved = false
       RETURNING *`,
      [req.user.userId, parseInt(id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Alert not found or already resolved' });
    }
    await logActivity(req.user.userId, 'RESOLVE_SECURITY_ALERT', 'security_alerts', parseInt(id), req, 'success');
    res.json({ success: true, data: result.rows[0], message: 'Alert resolved' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, createUser, deleteUser, toggleUserActive, getAuditLogs, getStatistics, getSecurityAlerts, resolveSecurityAlert };
