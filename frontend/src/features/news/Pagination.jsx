export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination" aria-label="News pagination">
      <button
        className="arrow"
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          className={page === currentPage ? 'active' : ''}
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="arrow"
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        ›
      </button>
    </div>
  );
}
