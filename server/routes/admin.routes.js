const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  deleteUser,
  toggleUserActive,
  getAuditLogs,
  getStatistics,
  getSecurityAlerts,
  resolveSecurityAlert,
} = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { registerValidation, handleValidationErrors } = require('../middleware/validate');

router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.post('/users', registerValidation, handleValidationErrors, createUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.get('/audit-logs', getAuditLogs);
router.get('/statistics', getStatistics);
router.get('/security-alerts', getSecurityAlerts);
router.patch('/security-alerts/:id/resolve', resolveSecurityAlert);

module.exports = router;
