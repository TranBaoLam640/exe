import { imageUrl } from '../assets/imageUrl.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const team = [
  ['hoang_anh.jpg', 'Quách Hoàng Anh', 'General Management / Marketing Manager', 'biz'],
  ['phan_huyen_tran.jpg', 'Phan Huyền Trân', 'Finance & Business Executive', 'biz'],
  ['con_cho_ngu_dan.jpg', 'Nguyễn Quang Anh', 'Front-End Developer', 'dev'],
  ['tran_bao_lam.jpg', 'Trần Bảo Lâm', 'Back-End Developer', 'dev'],
];

export default function AboutPage() {
  useDocumentTitle('Về Chúng Tôi | DoRentMe');
  useFadeIn('.about-page');

  return (
    <div className="about-page">
      <section className="legacy-hero about-hero">
        <div className="hero-icon" aria-hidden="true">👥</div>
        <h1>Về DoRentMe</h1>
        <p>Chúng tôi tin rằng mọi người đều xứng đáng có một stylist cá nhân. Chúng tôi tạo ra stylist đó bằng AI.</p>
      </section>

      <section className="mission">
        <div className="mission-inner">
          <div className="mission-img-placeholder fade-in">
            <img src={imageUrl('hoang_anh.jpg')} alt="Quách Hoàng Anh" />
          </div>
          <div className="mission-text fade-in">
            <span className="section-tag">Sứ mệnh</span>
            <h2>Sứ Mệnh Của Chúng Tôi</h2>
            <p>
              Tại DoRentMe, sứ mệnh của chúng tôi là <strong>dân chủ hóa thời trang cá nhân</strong>. Bằng AI,
              DoRentMe mang đến lời khuyên phối đồ chuyên nghiệp, cá nhân hóa và tức thì cho bất kỳ ai.
            </p>
            <ul className="mission-list">
              <li>Cá nhân hóa phong cách của bạn bằng AI.</li>
              <li>Quản lý tủ đồ của bạn một cách thông minh.</li>
              <li>Thử trang phục ngay lập tức mà không cần mặc.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tech">
        <span className="section-tag">Nền tảng</span>
        <h2>Công Nghệ Cốt Lõi Của DoRentMe</h2>
        <p className="sub">DoRentMe được xây dựng trên ba trụ cột công nghệ chính để mang lại trải nghiệm thời trang toàn diện.</p>
        <div className="tech-grid">
          {['Trợ lý AI Thông Minh', 'Tủ Đồ Số 4.0', 'Thử Đồ Ảo'].map((title) => (
            <div className="tech-card fade-in" key={title}>
              <div className="tech-card-bar" />
              <div className="tech-card-body">
                <h3>{title}</h3>
                <p>Trải nghiệm thời trang số hóa, tư vấn nhanh và hỗ trợ lựa chọn trang phục phù hợp hoàn cảnh.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="team">
        <div className="team-header fade-in">
          <span className="section-tag">Con người</span>
          <h2>Gặp Gỡ Đội Ngũ</h2>
          <p>Những con người đứng sau DoRentMe - đam mê thời trang và công nghệ.</p>
        </div>
        <div className="team-grid">
          {team.map(([img, name, role, type]) => (
            <div className="team-card fade-in" key={name}>
              <div className="team-avatar"><img src={imageUrl(img)} alt={name} /></div>
              <div className="team-info"><div className="team-name">{name}</div><div className={`team-role ${type}`}>{role}</div></div>
            </div>
          ))}
        </div>
        <div className="team-grid-bottom">
          <div className="team-card fade-in">
            <div className="team-avatar"><img src={imageUrl('nguyen_duc_duong.jpg')} alt="Nguyễn Đức Dương" /></div>
            <div className="team-info"><div className="team-name">Nguyễn Đức Dương</div><div className="team-role dev">Back-End & Algorithm Engineer</div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
