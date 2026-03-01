const express = require('express');
const router = express.Router();
const {
  getAllVolunteers,
  getVolunteerById,
  getMyProfile,
  updateVolunteerProfile,
  logHours,
  getHours,
  approveHours,
} = require('../controllers/volunteer.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { logHoursValidation, handleValidationErrors } = require('../middleware/validate');

// Get own volunteer profile (for logged-in volunteer)
router.get('/me', authenticate, authorize('volunteer'), getMyProfile);

// List all volunteers (admin/coordinator only)
router.get('/', authenticate, authorize('admin', 'coordinator'), getAllVolunteers);

// Get volunteer by profile ID
router.get('/:id', authenticate, getVolunteerById);

// Update volunteer profile
router.put('/:id', authenticate, updateVolunteerProfile);

// Log hours
router.post('/:id/hours', authenticate, logHoursValidation, handleValidationErrors, logHours);

// Get hours history
router.get('/:id/hours', authenticate, getHours);

// Approve hours (admin/coordinator only)
router.put('/hours/:hoursId/approve', authenticate, authorize('admin', 'coordinator'), approveHours);

module.exports = router;
