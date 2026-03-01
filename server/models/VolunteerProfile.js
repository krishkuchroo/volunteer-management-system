const db = require('../config/database');

const VolunteerProfile = {
  async findById(id) {
    const result = await db.query(
      `SELECT vp.*, u.first_name, u.last_name, u.email, u.phone
       FROM volunteer_profiles vp
       JOIN users u ON vp.user_id = u.id
       WHERE vp.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const result = await db.query(
      `SELECT vp.*, u.first_name, u.last_name, u.email, u.phone
       FROM volunteer_profiles vp
       JOIN users u ON vp.user_id = u.id
       WHERE vp.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async create(client, userId) {
    const result = await client.query(
      'INSERT INTO volunteer_profiles (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return result.rows[0];
  },

  async update(id, { addressEncrypted, emergencyContactEncrypted, skills, availability }) {
    const result = await db.query(
      `UPDATE volunteer_profiles
       SET address_encrypted           = COALESCE($1, address_encrypted),
           emergency_contact_encrypted = COALESCE($2, emergency_contact_encrypted),
           skills                      = COALESCE($3, skills),
           availability                = COALESCE($4, availability)
       WHERE id = $5
       RETURNING *`,
      [addressEncrypted, emergencyContactEncrypted, skills || null, availability || null, id]
    );
    return result.rows[0] || null;
  },

  async updateBackgroundCheck(id, { status, notes, date }) {
    const result = await db.query(
      `UPDATE volunteer_profiles
       SET background_check_status = $1,
           background_check_notes  = COALESCE($2, background_check_notes),
           background_check_date   = COALESCE($3, background_check_date)
       WHERE id = $4
       RETURNING id, background_check_status, background_check_notes, background_check_date, updated_at`,
      [status, notes || null, date || null, id]
    );
    return result.rows[0] || null;
  },

  async addHours(id, hours) {
    await db.query(
      'UPDATE volunteer_profiles SET hours_logged = hours_logged + $1 WHERE id = $2',
      [hours, id]
    );
  },

  async findAll({ status, search, limit, offset }) {
    let where = 'WHERE u.is_active = true';
    const params = [];
    let i = 1;

    if (status) { where += ` AND vp.background_check_status = $${i++}`; params.push(status); }
    if (search) {
      where += ` AND (u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.email ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM volunteer_profiles vp JOIN users u ON vp.user_id = u.id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT vp.id, u.id as user_id, u.first_name, u.last_name, u.email,
              vp.skills, vp.background_check_status, vp.hours_logged, vp.created_at
       FROM volunteer_profiles vp
       JOIN users u ON vp.user_id = u.id
       ${where}
       ORDER BY vp.created_at DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limit, offset]
    );
    return { volunteers: result.rows, total };
  },
};

module.exports = VolunteerProfile;
