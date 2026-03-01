const db = require('../config/database');
const VolunteerProfile = require('../models/VolunteerProfile');
const { logActivity } = require('../middleware/logger');
const { emit } = require('../socket');

async function getAllBackgroundChecks(req, res, next) {
  try {
    const { status = 'pending' } = req.query;

    const result = await db.query(
      `SELECT vp.id as volunteer_id, u.first_name, u.last_name, u.email,
              vp.background_check_status as status,
              vp.background_check_notes as notes,
              vp.background_check_date as check_date,
              vp.created_at as submitted_at
       FROM volunteer_profiles vp
       JOIN users u ON vp.user_id = u.id
       WHERE vp.background_check_status = $1
       ORDER BY vp.created_at ASC`,
      [status]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function updateBackgroundCheckStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }

    const updated = await VolunteerProfile.updateBackgroundCheck(id, {
      status,
      notes: notes || null,
      date: status === 'approved' || status === 'rejected' ? new Date().toISOString().split('T')[0] : null,
    });

    await logActivity(
      req.user.userId,
      'UPDATE_BG_CHECK',
      'volunteer_profiles',
      parseInt(id),
      req,
      'success',
      { status }
    );

    // Notify the volunteer and coordinators via WebSocket
    emit(`user-${volunteer.user_id}`, 'background-check-updated', { status, volunteerId: parseInt(id) });
    emit('coordinator', 'volunteer-update', { volunteerId: parseInt(id), type: 'background-check', status });

    res.json({
      success: true,
      data: {
        volunteerId: parseInt(id),
        status: updated.background_check_status,
        notes: updated.background_check_notes,
        updatedAt: updated.updated_at,
      },
      message: 'Background check status updated',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllBackgroundChecks, updateBackgroundCheckStatus };
