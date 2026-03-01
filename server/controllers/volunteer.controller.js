const db = require('../config/database');
const VolunteerProfile = require('../models/VolunteerProfile');
const { encrypt, decrypt } = require('../utils/encryption');
const { logActivity } = require('../middleware/logger');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { getCached, invalidatePattern } = require('../config/redis');
const { emit } = require('../socket');

async function getAllVolunteers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, search } = req.query;

    const cacheKey = `volunteers:${page}:${limit}:${status || 'all'}:${search || ''}`;
    const data = await getCached(cacheKey, async () => {
      const { volunteers, total } = await VolunteerProfile.findAll({
        status: status || null,
        search: search || null,
        limit,
        offset,
      });
      return { volunteers, pagination: buildPaginationMeta(page, limit, total) };
    }, 300);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getVolunteerById(req, res, next) {
  try {
    const { id } = req.params;
    const volunteer = await VolunteerProfile.findById(id);

    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }

    // Volunteers can only view their own profile
    if (req.user.role === 'volunteer' && volunteer.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own profile' });
    }

    const response = { ...volunteer };
    if (response.address_encrypted) {
      response.address = decrypt(response.address_encrypted);
    }
    if (response.emergency_contact_encrypted) {
      response.emergencyContact = decrypt(response.emergency_contact_encrypted);
    }
    delete response.address_encrypted;
    delete response.emergency_contact_encrypted;

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const volunteer = await VolunteerProfile.findByUserId(req.user.userId);
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found' });
    }

    const response = { ...volunteer };
    if (response.address_encrypted) response.address = decrypt(response.address_encrypted);
    if (response.emergency_contact_encrypted) response.emergencyContact = decrypt(response.emergency_contact_encrypted);
    delete response.address_encrypted;
    delete response.emergency_contact_encrypted;

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
}

async function updateVolunteerProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { address, emergencyContact, skills, availability } = req.body;

    const existing = await VolunteerProfile.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }

    if (req.user.role === 'volunteer' && existing.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only update your own profile' });
    }

    const updated = await VolunteerProfile.update(id, {
      addressEncrypted: address ? encrypt(address) : null,
      emergencyContactEncrypted: emergencyContact ? encrypt(emergencyContact) : null,
      skills: skills || null,
      availability: availability || null,
    });

    await logActivity(req.user.userId, 'UPDATE_VOLUNTEER', 'volunteer_profiles', parseInt(id), req, 'success');
    await invalidatePattern('volunteers:*');

    res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function logHours(req, res, next) {
  try {
    const { id } = req.params;
    const { date, hours, description } = req.body;

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }

    if (req.user.role === 'volunteer' && volunteer.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only log hours for yourself' });
    }

    const result = await db.query(
      `INSERT INTO volunteer_hours (volunteer_id, date, hours, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, date, hours, description || null]
    );

    await VolunteerProfile.addHours(id, hours);
    await logActivity(req.user.userId, 'LOG_HOURS', 'volunteer_hours', result.rows[0].id, req, 'success');

    res.status(201).json({ success: true, data: result.rows[0], message: 'Hours logged successfully' });
  } catch (err) {
    next(err);
  }
}

async function getHours(req, res, next) {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }

    if (req.user.role === 'volunteer' && volunteer.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own hours' });
    }

    let query = `
      SELECT vh.id, vh.date, vh.hours, vh.description, vh.created_at,
             u.first_name || ' ' || u.last_name as approved_by,
             vh.approved_at
      FROM volunteer_hours vh
      LEFT JOIN users u ON vh.approved_by = u.id
      WHERE vh.volunteer_id = $1
    `;
    const params = [id];
    let i = 2;

    if (startDate) { query += ` AND vh.date >= $${i++}`; params.push(startDate); }
    if (endDate)   { query += ` AND vh.date <= $${i++}`; params.push(endDate); }
    query += ' ORDER BY vh.date DESC';

    const result = await db.query(query, params);
    const totalResult = await db.query(
      'SELECT COALESCE(SUM(hours), 0) as total FROM volunteer_hours WHERE volunteer_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        totalHours: parseFloat(totalResult.rows[0].total),
        entries: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function approveHours(req, res, next) {
  try {
    const { hoursId } = req.params;
    const result = await db.query(
      `UPDATE volunteer_hours
       SET approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [req.user.userId, hoursId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Hours entry not found' });
    }

    await logActivity(req.user.userId, 'APPROVE_HOURS', 'volunteer_hours', parseInt(hoursId), req, 'success');
    await invalidatePattern('volunteers:*');

    // Notify volunteer via WebSocket
    const hoursRow = result.rows[0];
    emit(`user-${hoursRow.volunteer_id}`, 'hours-approved', { hoursId: parseInt(hoursId), hours: hoursRow.hours, date: hoursRow.date });

    res.json({ success: true, data: result.rows[0], message: 'Hours approved successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllVolunteers,
  getVolunteerById,
  getMyProfile,
  updateVolunteerProfile,
  logHours,
  getHours,
  approveHours,
};
