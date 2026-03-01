const db = require('../config/database');
const crypto = require('crypto');

const PasswordResetToken = {
  async create(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
    return token;
  },

  async findValid(token) {
    const result = await db.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = false AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0] || null;
  },

  async markUsed(id) {
    await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [id]);
  },

  async deleteExpired() {
    await db.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP OR used = true'
    );
  },
};

module.exports = PasswordResetToken;
