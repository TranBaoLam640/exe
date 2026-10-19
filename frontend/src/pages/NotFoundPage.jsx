import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="foundation-page">
      <p className="eyebrow">404</p>
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển hướng.</p>
      <Link className="text-link" to="/">
        Quay lại trang chủ
      </Link>
    </section>
  );
}
