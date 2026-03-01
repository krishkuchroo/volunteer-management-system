const db = require('../config/database');

const User = {
  async findById(id) {
    const result = await db.query(
      `SELECT id, email, role, first_name, last_name, phone,
              is_verified, is_active, two_factor_enabled, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await db.query(
      `SELECT id, email, password_hash, role, first_name, last_name,
              phone, is_verified, is_active, two_factor_enabled, two_factor_secret,
              created_at, last_login
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  async create(client, { email, passwordHash, role, firstName, lastName, phone }) {
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, email, role, first_name, last_name, created_at`,
      [email, passwordHash, role, firstName, lastName, phone || null]
    );
    return result.rows[0];
  },

  async updateProfile(id, { firstName, lastName, phone }) {
    const result = await db.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           phone      = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, email, role, first_name, last_name, phone, is_verified, created_at`,
      [firstName || null, lastName || null, phone || null, id]
    );
    return result.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },

  async updateLastLogin(id) {
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  },

  async setActive(id, isActive) {
    await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);
  },

  async update2FA(id, { secret, enabled }) {
    await db.query(
      'UPDATE users SET two_factor_secret = $1, two_factor_enabled = $2 WHERE id = $3',
      [secret, enabled, id]
    );
  },

  async findByIdWithSecret(id) {
    const result = await db.query(
      `SELECT id, email, role, first_name, last_name, two_factor_enabled, two_factor_secret
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  },

  async findAll({ role, isActive, limit, offset }) {
    let query = `
      SELECT id, email, role, first_name, last_name, phone,
             is_verified, is_active, created_at, last_login
      FROM users WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (role) { query += ` AND role = $${i++}`; params.push(role); }
    if (isActive !== undefined) { query += ` AND is_active = $${i++}`; params.push(isActive); }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users WHERE 1=1${role ? ` AND role = '${role}'` : ''}${isActive !== undefined ? ` AND is_active = ${isActive}` : ''}`,
      []
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return { users: result.rows, total };
  },
};

module.exports = User;
