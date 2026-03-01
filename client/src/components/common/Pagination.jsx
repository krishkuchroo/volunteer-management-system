export default function Pagination({ pagination, onPageChange }) {
  const { currentPage, totalPages } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages} ({pagination.totalRecords} total)
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary text-sm px-3 py-1"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary text-sm px-3 py-1"
        >
          Next
        </button>
      </div>
    </div>
  );
}
