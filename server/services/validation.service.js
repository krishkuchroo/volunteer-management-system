// Additional validation helpers beyond express-validator rules

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
}

function isValidRole(role) {
  return ['admin', 'coordinator', 'volunteer'].includes(role);
}

function isValidBgCheckStatus(status) {
  return ['pending', 'in_progress', 'approved', 'rejected'].includes(status);
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { isStrongPassword, isValidRole, isValidBgCheckStatus, sanitizeUser };
