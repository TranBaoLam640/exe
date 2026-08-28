import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import ProductCard from '../features/catalog/components/ProductCard.jsx';
import { getProducts } from '../features/catalog/services/catalogService.js';
import { newsArticles } from '../data/newsArticles.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const featuredImages = [
  'image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg',
  'image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg',
  'image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg',
  'image/vay_lua/jolie_loft_dam_lua_kem_hali_dress.jpg',
  'image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg',
  'image/vay_du_tiec/so_vintage_nathalia.jpg',
];

const steps = [
  ['👗', 'Chọn trang phục', 'Duyệt qua hàng nghìn thiết kế, lọc theo dịp, phong cách và kích cỡ phù hợp.'],
  ['🤖', 'Thử đồ bằng AI', 'Upload ảnh của bạn và xem ngay cách trang phục sẽ trông như thế nào khi mặc.'],
  ['🚚', 'Nhận & Trả đồ', 'Chúng tôi giao tận nơi, bạn mặc xong chỉ cần bỏ vào túi — chúng tôi lo phần còn lại.'],
];

const aiCards = [
  ['⚡', 'Virtual Try-On', 'Thử hàng trăm bộ đồ chỉ trong vài giây'],
  ['💬', 'AI Stylist', 'Trợ lý thời trang AI sẵn sàng tư vấn 24/7'],
  ['📐', 'Size Finder', 'Xác định size chính xác theo số đo của bạn'],
  ['🎨', 'Colour Match', 'Phối màu hoàn hảo theo tông da cá nhân'],
];

const reviews = [
  {
    avatar: 'L',
    avatarClass: 'green',
    text: '"Chiếc đầm dạ hội mình thuê hoàn hảo đến mức cả đám cưới hỏi mua ở đâu. Tính năng AI giúp mình tự tin hơn!"',
    name: 'Thư Nguyễn',
    info: 'Hoàng Mai, Hà Nội · Thuê 6 lần',
  },
  {
    avatar: 'M',
    avatarClass: 'blue',
    text: '"Giao diện đẹp, tìm đồ dễ cực. AI stylist gợi ý cho tôi bộ vest phù hợp buổi phỏng vấn, kết quả là tôi đã có việc làm mới!          "',
    name: 'Minh Trần',
    info: 'Tây Hồ, Hà Nội · Thuê 5 lần',
  },
  {
    avatar: 'H',
    avatarClass: 'pink',
    text: '"Tiết kiệm quá! Thuê áo dài cách tân cho lễ tốt nghiệp chỉ tốn 1/10 so với mua. Đồ sạch, thơm, giao đúng giờ.            "',
    name: 'Hà Phương',
    info: 'Thôn 3, Hòa Lạc · Thuê 3 lần',
  },
];

function SectionHeading({ tag, title, sub }) {
  return (
    <>
      <div className="home-section-tag">{tag}</div>
      <h2 className="home-section-title">{title}</h2>
      {sub ? <p className="home-section-sub">{sub}</p> : null}
    </>
  );
}

export default function HomePage() {
  useDocumentTitle('DoRentMe - Trợ Lý Thời Trang AI');
  useFadeIn('.home-page');
  const products = getProducts();
  const featuredProducts = featuredImages.map((image) => products.find((product) => product.image === image)).filter(Boolean);
  const previewArticles = newsArticles.slice(0, 3);

  return (
    <div className="home-page">
      <section className="home-hero">
        <span className="home-hero-badge">✦ Thời trang AI thế hệ mới</span>
        <h1>Trợ Lý Thời Trang AI<br />Của Riêng Bạn</h1>
        <p>Khám phá phong cách cá nhân, cho thuê trang phục cao cấp và thử đồ ảo thông minh — tất cả tại một nơi.</p>
        <div className="home-hero-btns">
          <Link to="/shop" className="home-btn-primary">Xem bộ sưu tập ngay</Link>
          <Link to="/ai-tryon" className="home-btn-secondary">Thử đồ AI miễn phí</Link>
          <a href="https://forms.gle/GFz1dVHmityymatcA" target="_blank" rel="noopener noreferrer" className="home-btn-feedback">Đóng góp ý kiến</a>
        </div>
      </section>

      <div className="home-stats-bar">
        <div className="home-stat-item"><div className="num">2,500+</div><div className="label">Trang phục cao cấp</div></div>
        <div className="home-stat-item"><div className="num">15,000+</div><div className="label">Khách hàng hài lòng</div></div>
        <div className="home-stat-item"><div className="num">98%</div><div className="label">Đánh giá tích cực</div></div>
        <div className="home-stat-item"><div className="num">24/7</div><div className="label">Trợ lý AI hỗ trợ</div></div>
      </div>

      <section className="home-products">
        <SectionHeading tag="Bộ sưu tập" title="Trang Phục Nổi Bật" sub="Những thiết kế được yêu thích nhất tuần này — từ dạ hội sang trọng đến street style năng động." />
        <div className="home-products-grid">
          {featuredProducts.map((product) => <ProductCard product={product} variant="home" key={product.id} />)}
        </div>
      </section>

      <section className="home-how-it-works">
        <SectionHeading tag="Đơn giản & Nhanh chóng" title="Cách Hoạt Động" sub="Chỉ 3 bước đơn giản để sở hữu phong cách hoàn hảo mà không tốn quá nhiều." />
        <div className="home-steps">
          {steps.map(([icon, title, text], index) => (
            <div className="home-step fade-in" key={title}>
              <div className="home-step-icon">{icon}<span className="home-step-num">{index + 1}</span></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-ai-banner">
        <div className="home-ai-banner-inner">
          <div>
            <div className="home-section-tag align-left">Công nghệ AI tiên tiến</div>
            <h2>Thử Đồ Ảo & Trợ Lý AI Thời Trang</h2>
            <p>Không còn lo lắng về việc chọn nhầm size hay kiểu dáng. AI của DoRentMe phân tích vóc dáng và phong cách của bạn để đưa ra gợi ý chính xác nhất.</p>
            <ul className="home-ai-features-list">
              <li>Thử đồ ảo 3D chỉ với 1 tấm ảnh</li>
              <li>Gợi ý phối đồ theo dịp (tiệc, công sở, du lịch...)</li>
              <li>Chatbot thời trang hoạt động 24/7</li>
              <li>Phân tích màu sắc phù hợp với tông da</li>
            </ul>
            <Link to="/ai-tryon" className="home-btn-primary">Trải nghiệm AI miễn phí →</Link>
          </div>
          <div className="home-ai-cards">
            {aiCards.map(([icon, title, text]) => (
              <div className="home-ai-card" key={title}>
                <div className="icon">{icon}</div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-testimonials">
        <SectionHeading tag="Khách hàng nói gì" title="Đánh Giá Từ Cộng Đồng" sub="Hơn 15.000 khách hàng đã tin tưởng DoRentMe cho những khoảnh khắc quan trọng." />
        <div className="home-reviews-grid">
          {reviews.map((review) => (
            <div className="home-review-card fade-in" key={review.name}>
              <div className="home-review-stars">★★★★★</div>
              <p className="home-review-text">{review.text}</p>
              <div className="home-reviewer">
                <div className={`home-reviewer-avatar ${review.avatarClass}`}>{review.avatar}</div>
                <div><div className="home-reviewer-name">{review.name}</div><div className="home-reviewer-info">{review.info}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-news-preview">
        <div className="home-news-preview-header">
          <div className="left">
            <div className="home-section-tag align-left">Cập nhật mới nhất</div>
            <h2 className="home-section-title align-left">Tin Tức & Xu Hướng</h2>
          </div>
          <Link to="/news" className="home-view-all">Xem tất cả →</Link>
        </div>
        <div className="home-news-cards-grid">
          {previewArticles.map((article, index) => (
            <Link to={`/news_detail?index=${index}`} className="home-news-card-item fade-in" key={article.title}>
              {article.image ? <img className="home-news-thumb" src={imageUrl(article.image)} alt={article.title} /> : <div className="home-news-thumb-placeholder">📰</div>}
              <div className="home-news-body">
                <div className="home-news-date">📅 {article.date}</div>
                <div className="home-news-title">{article.title}</div>
                <div className="home-news-desc">{article.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
