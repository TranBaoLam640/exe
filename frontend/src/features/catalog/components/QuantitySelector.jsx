export default function QuantitySelector({ value, onChange }) {
  function changeBy(delta) {
    onChange(Math.min(10, Math.max(1, value + delta)));
  }

  return (
    <div className="catalog-qty-selector">
      <button className="catalog-qty-btn" type="button" onClick={() => changeBy(-1)}>−</button>
      <input className="catalog-qty-input" type="text" value={value} readOnly />
      <button className="catalog-qty-btn" type="button" onClick={() => changeBy(1)}>+</button>
    </div>
  );
}
