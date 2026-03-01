const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const {
  updateProfileValidation,
  changePasswordValidation,
  handleValidationErrors,
} = require('../middleware/validate');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, handleValidationErrors, changePassword);

module.exports = router;
