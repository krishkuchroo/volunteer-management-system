const db = require('../config/database');

const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_WINDOW_MIN = 15;
const PRIVILEGE_ESC_THRESHOLD = 3;
const PRIVILEGE_ESC_WINDOW_MIN = 60;

async function createAlert(alertType, identifier, details) {
  try {
    await db.query(
      `INSERT INTO security_alerts (alert_type, identifier, details)
       VALUES ($1, $2, $3)`,
      [alertType, String(identifier), JSON.stringify(details)]
    );
  } catch (err) {
    console.error('SIEM alert creation error:', err.message);
  }
}

// Fire-and-forget: call after a failed login to detect brute force
async function detectBruteForce(ipAddress) {
  if (!ipAddress) return;
  try {
    const result = await db.query(
      `SELECT COUNT(*) as attempts
       FROM activity_logs
       WHERE action = 'LOGIN_FAILED'
         AND ip_address = $1
         AND timestamp > NOW() - INTERVAL '${BRUTE_FORCE_WINDOW_MIN} minutes'`,
      [ipAddress]
    );
    const attempts = parseInt(result.rows[0].attempts, 10);
    if (attempts >= BRUTE_FORCE_THRESHOLD) {
      // Only create alert if no unresolved one already exists for this IP
      const existing = await db.query(
        `SELECT id FROM security_alerts
         WHERE alert_type = 'BRUTE_FORCE'
           AND identifier = $1
           AND resolved = false
           AND created_at > NOW() - INTERVAL '${BRUTE_FORCE_WINDOW_MIN} minutes'`,
        [ipAddress]
      );
      if (existing.rows.length === 0) {
        await createAlert('BRUTE_FORCE', ipAddress, { attempts, windowMinutes: BRUTE_FORCE_WINDOW_MIN });
      }
    }
  } catch (err) {
    console.error('SIEM brute force check error:', err.message);
  }
}

// Fire-and-forget: call after a 403 to detect privilege escalation
async function detectPrivilegeEscalation(userId) {
  if (!userId) return;
  try {
    const result = await db.query(
      `SELECT COUNT(*) as attempts
       FROM activity_logs
       WHERE user_id = $1
         AND status = 'failure'
         AND action LIKE '%UNAUTHORIZED%'
         AND timestamp > NOW() - INTERVAL '${PRIVILEGE_ESC_WINDOW_MIN} minutes'`,
      [userId]
    );
    const attempts = parseInt(result.rows[0].attempts, 10);
    if (attempts >= PRIVILEGE_ESC_THRESHOLD) {
      const existing = await db.query(
        `SELECT id FROM security_alerts
         WHERE alert_type = 'PRIVILEGE_ESCALATION'
           AND identifier = $1
           AND resolved = false
           AND created_at > NOW() - INTERVAL '${PRIVILEGE_ESC_WINDOW_MIN} minutes'`,
        [String(userId)]
      );
      if (existing.rows.length === 0) {
        await createAlert('PRIVILEGE_ESCALATION', userId, {
          attempts,
          windowMinutes: PRIVILEGE_ESC_WINDOW_MIN,
        });
      }
    }
  } catch (err) {
    console.error('SIEM privilege escalation check error:', err.message);
  }
}

module.exports = { detectBruteForce, detectPrivilegeEscalation };
