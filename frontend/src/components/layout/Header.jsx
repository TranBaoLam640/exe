import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { imageUrl } from '../../assets/imageUrl.js';
import { useLegacyHeaderState } from '../../hooks/useLegacyHeaderState.js';

const reactNav = new Map([
  ['/about', 'Giới thiệu'],
  ['/contact', 'Liên hệ'],
]);

function ServiceDropdown() {
  return (
    <div className="nav-item">
      <a href="/shop.html">Dịch vụ</a>
      <div className="dropdown-menu">
        <div className="dropdown-inner">
          <a href="/chatbotAI.html">AI Phối đồ</a>
          <a href="/ai-tryon.html">Thử đồ 3D</a>
          <a href="/shop.html">Shop</a>
          <Link to="/news">Tin tức</Link>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { session, cartQuantity, hasOrders } = useLegacyHeaderState();
  const transparent = location.pathname === '/about' || location.pathname === '/contact';
  const activeLabel = reactNav.get(location.pathname);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener('scroll', update);
    return () => window.removeEventListener('scroll', update);
  }, [location.pathname]);

  function logout(event) {
    event.preventDefault();
    localStorage.removeItem('dorentme_session');
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: null }));
    window.location.href = '/index.html';
  }

  return (
    <header className={`site-header ${transparent && !scrolled ? 'site-header--transparent' : 'site-header--solid'}`}>
      <div className="logo">
        <Link to="/" aria-label="DoRentMe home">
          <img src={imageUrl('Logo.png')} alt="DoRentMe Logo" />
        </Link>
      </div>
      <nav className="nav-menu" aria-label="Primary navigation">
        <a href="/index.html">Trang chủ</a>
        <ServiceDropdown />
        <Link className={activeLabel === 'Giới thiệu' ? 'active' : ''} to="/about">
          Giới thiệu
        </Link>
        <Link className={activeLabel === 'Liên hệ' ? 'active' : ''} to="/contact">
          Liên hệ
        </Link>
      </nav>
      <div className="nav-right">
        <a className="cart-link" href="/cart.html" title="Giỏ hàng" aria-label={`Giỏ hàng: ${cartQuantity} sản phẩm`}>
          🛒
          <span className="cart-badge" style={{ display: cartQuantity > 0 ? 'flex' : 'none' }}>
            {cartQuantity}
          </span>
        </a>
        <a className="orders-link" href="/orders.html" title="Đơn hàng của tôi" aria-label="Đơn hàng của tôi">
          {hasOrders ? '🚚' : '📦'}
        </a>
        {session ? (
          <>
            <span className="auth-greeting">👋 {session.name}</span>
            <a className="nav-btn outline" href="/index.html" onClick={logout}>
              Đăng xuất
            </a>
          </>
        ) : (
          <>
            <a className="nav-btn outline" href="/login.html">
              Đăng nhập
            </a>
            <a className="nav-btn fill" href="/register.html">
              Đăng ký
            </a>
          </>
        )}
      </div>
    </header>
  );
}
