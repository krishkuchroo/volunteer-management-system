const db = require('../config/database');

const ActivityLog = {
  async findAll({ userId, action, startDate, endDate, limit, offset }) {
    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (userId)    { where += ` AND al.user_id = $${i++}`;       params.push(userId); }
    if (action)    { where += ` AND al.action ILIKE $${i++}`;    params.push(`%${action}%`); }
    if (startDate) { where += ` AND al.timestamp >= $${i++}`;    params.push(startDate); }
    if (endDate)   { where += ` AND al.timestamp <= $${i++}`;    params.push(endDate + ' 23:59:59'); }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM activity_logs al ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT al.id, al.user_id, al.action, al.resource, al.resource_id,
              al.ip_address, al.timestamp, al.status, al.details,
              u.first_name || ' ' || u.last_name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.timestamp DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limit, offset]
    );
    return { logs: result.rows, total };
  },
};

module.exports = ActivityLog;
