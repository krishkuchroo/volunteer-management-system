const express = require('express');
const router = express.Router();
const { getAllBackgroundChecks, updateBackgroundCheckStatus } = require('../controllers/backgroundCheck.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { bgCheckStatusValidation, handleValidationErrors } = require('../middleware/validate');

router.use(authenticate, authorize('admin', 'coordinator'));

router.get('/', getAllBackgroundChecks);
router.put('/:id/status', bgCheckStatusValidation, handleValidationErrors, updateBackgroundCheckStatus);

module.exports = router;
