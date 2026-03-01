const { detectPrivilegeEscalation } = require('../services/siem.service');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      detectPrivilegeEscalation(req.user.userId); // fire-and-forget
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
      });
    }
    next();
  };
}

module.exports = authorize;
