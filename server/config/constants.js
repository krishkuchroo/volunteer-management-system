module.exports = {
  ROLES: {
    ADMIN: 'admin',
    COORDINATOR: 'coordinator',
    VOLUNTEER: 'volunteer',
  },
  BG_CHECK_STATUSES: ['pending', 'in_progress', 'approved', 'rejected'],
  JWT_EXPIRY: '24h',
  SALT_ROUNDS: 10,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
  },
};
