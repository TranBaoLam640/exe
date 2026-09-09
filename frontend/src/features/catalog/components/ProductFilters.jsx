import { brandOptions as fallbackBrandOptions, categoryOptions as fallbackCategoryOptions } from '../services/catalogService.js';

export default function ProductFilters({
  currentCategory,
  currentBrand,
  onCategoryChange,
  onBrandChange,
  categories = fallbackCategoryOptions,
  brands = fallbackBrandOptions,
}) {
  return (
    <aside className="catalog-sidebar">
      <div className="catalog-sidebar-section">
        <div className="catalog-sidebar-title">Danh mục sản phẩm</div>
        {categories.map((option) => (
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
        {brands.map((option) => (
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
