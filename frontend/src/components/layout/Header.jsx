import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { imageUrl } from '../../assets/imageUrl.js';
import { logout as logoutSession } from '../../features/auth/authService.js';
import { useLegacyHeaderState } from '../../hooks/useLegacyHeaderState.js';

const reactNav = new Map([
  ['/shop', 'Dịch vụ'],
  ['/about', 'Giới thiệu'],
  ['/contact', 'Liên hệ'],
]);

function ServiceDropdown({ active }) {
  return (
    <div className="nav-item">
      <Link className={active ? 'active' : ''} to="/shop">Dịch vụ</Link>
      <div className="dropdown-menu">
        <div className="dropdown-inner">
          <Link to="/chatbot">AI Phối đồ</Link>
          <a href="/ai-tryon.html">Thử đồ 3D</a>
          <Link to="/shop">Shop</Link>
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
  const transparent = location.pathname === '/' || location.pathname === '/shop' || location.pathname === '/about' || location.pathname === '/contact';
  const activeLabel = location.pathname.startsWith('/product/') ? 'Dịch vụ' : reactNav.get(location.pathname);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener('scroll', update);
    return () => window.removeEventListener('scroll', update);
  }, [location.pathname]);

  function logout(event) {
    event.preventDefault();
    logoutSession();
    window.location.href = '/';
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
        <ServiceDropdown active={activeLabel === 'Dịch vụ'} />
        <Link className={activeLabel === 'Giới thiệu' ? 'active' : ''} to="/about">
          Giới thiệu
        </Link>
        <Link className={activeLabel === 'Liên hệ' ? 'active' : ''} to="/contact">
          Liên hệ
        </Link>
      </nav>
      <div className="nav-right">
        <Link className="cart-link" to="/cart" title="Giỏ hàng" aria-label={`Giỏ hàng: ${cartQuantity} sản phẩm`}>
          🛒
          <span className="cart-badge" style={{ display: cartQuantity > 0 ? 'flex' : 'none' }}>
            {cartQuantity}
          </span>
        </Link>
        <Link className="orders-link" to="/orders" title="Đơn hàng của tôi" aria-label="Đơn hàng của tôi">
          {hasOrders ? '🚚' : '📦'}
        </Link>
        {session ? (
          <>
            <span className="auth-greeting">👋 {session.name}</span>
            <a className="nav-btn outline" href="/index.html" onClick={logout}>
              Đăng xuất
            </a>
          </>
        ) : (
          <>
            <Link className="nav-btn outline" to="/login">
              Đăng nhập
            </Link>
            <Link className="nav-btn fill" to="/register">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
