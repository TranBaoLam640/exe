import { brandOptions, categoryOptions } from '../services/catalogService.js';

export default function ProductFilters({ currentCategory, currentBrand, onCategoryChange, onBrandChange }) {
  return (
    <aside className="catalog-sidebar">
      <div className="catalog-sidebar-section">
        <div className="catalog-sidebar-title">Danh mục sản phẩm</div>
        {categoryOptions.map((option) => (
          <button
            className={`catalog-sidebar-link ${currentCategory === option.value ? 'active' : ''}`}
            type="button"
            onClick={() => onCategoryChange(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="catalog-sidebar-section">
        <div className="catalog-sidebar-title">Thương hiệu</div>
        {brandOptions.map((option) => (
          <button
            className={`catalog-brand-link ${currentBrand === option.value ? 'active' : ''}`}
            type="button"
            onClick={() => onBrandChange(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
