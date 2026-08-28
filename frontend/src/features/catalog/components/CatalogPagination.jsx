export default function CatalogPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="catalog-pagination">
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return (
          <button
            className={`catalog-page-btn ${page === currentPage ? 'active' : ''}`}
            type="button"
            onClick={() => onPageChange(page)}
            key={page}
          >
            {page}
          </button>
        );
      })}
      {currentPage < totalPages ? (
        <button className="catalog-page-btn arrow" type="button" onClick={() => onPageChange(currentPage + 1)}>
          →
        </button>
      ) : null}
    </div>
  );
}
