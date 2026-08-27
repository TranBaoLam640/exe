import { Link } from 'react-router-dom';
import { imageUrl } from '../../assets/imageUrl.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={imageUrl('Logo.png')} alt="DoRentMe" />
          <p>Nền tảng cho thuê thời trang AI hàng đầu Việt Nam. Phong cách không giới hạn, chi phí tối ưu.</p>
        </div>
        <div className="footer-col">
          <h4>Dịch vụ</h4>
          <a href="/shop.html">Danh mục đồ thuê</a>
          <a href="/ai-tryon.html">AI Stylist</a>
          <a href="/loyalty.html">Gói thành viên</a>
        </div>
        <div className="footer-col">
          <h4>Hỗ trợ</h4>
          <Link to="/tutorial">Hướng dẫn thuê</Link>
          <Link to="/policy">Chính sách đổi trả</Link>
          <Link to="/contact">Liên hệ</Link>
        </div>
        <div className="footer-col">
          <h4>Công ty</h4>
          <Link to="/about">Về DoRentMe</Link>
          <Link to="/news">Tin tức</Link>
          <Link to="/terms">Điều khoản</Link>
        </div>
      </div>
      <div className="footer-bottom">© 2026 DoRentMe. Tất cả quyền được bảo lưu. · Làm với ❤️ tại Việt Nam</div>
    </footer>
  );
}
