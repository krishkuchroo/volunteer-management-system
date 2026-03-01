const db = require('../config/database');

async function logActivity(userId, action, resource, resourceId, req, status = 'success', details = {}) {
  try {
    await db.query(
      `INSERT INTO activity_logs
         (user_id, action, resource, resource_id, ip_address, user_agent, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        action,
        resource || null,
        resourceId || null,
        req.ip,
        req.get('user-agent') || null,
        status,
        JSON.stringify(details),
      ]
    );
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

function requestLogger(req, res, next) {
  res.on('finish', () => {
    if (req.user) {
      logActivity(
        req.user.userId,
        `${req.method} ${req.path}`,
        req.path.split('/')[1] || null,
        null,
        req,
        res.statusCode < 400 ? 'success' : 'failure',
        { statusCode: res.statusCode }
      );
    }
  });
  next();
}

module.exports = { logActivity, requestLogger };
