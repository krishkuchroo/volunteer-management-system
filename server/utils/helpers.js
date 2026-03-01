const { PAGINATION } = require('../config/constants');

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildPaginationMeta(page, limit, total) {
  return {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalRecords: total,
    limit,
  };
}

module.exports = { getPagination, buildPaginationMeta };
