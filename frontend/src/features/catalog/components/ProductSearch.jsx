export default function ProductSearch({ query, onQueryChange }) {
  return (
    <div className="catalog-search-box">
      <input
        type="text"
        value={query}
        placeholder="Tìm theo tên bộ váy..."
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <button type="button" onClick={() => onQueryChange(query)}>🔍</button>
    </div>
  );
}
