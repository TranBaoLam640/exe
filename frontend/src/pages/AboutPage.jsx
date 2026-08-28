import { imageUrl } from '../assets/imageUrl.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const techCards = [
  {
    title: 'Trợ lý AI Thông Minh',
    text: 'Trò chuyện với chatbot AI stylist, được đào tạo để hiểu phong cách, hoàn cảnh và tủ đồ của bạn để đưa ra gợi ý tức thì.',
  },
  {
    title: 'Tủ Đồ Số 4.0',
    text: 'Số hóa toàn bộ quần áo của bạn. Hệ thống của chúng tôi giúp bạn phân loại, theo dõi trạng thái và quản lý mọi món đồ bạn sở hữu.',
  },
  {
    title: 'Thử Đồ Ảo (Giả Lập)',
    text: 'Xem trước các bộ đồ trông như thế nào trên avatar của bạn, giúp bạn ra quyết định nhanh hơn mà không cần thử trực tiếp.',
  },
];

const teamMembers = [
  {
    name: 'Quách Hoàng Anh',
    role: 'General Management / Marketing Manager',
    roleClass: 'biz',
    image: 'hoang_anh.jpg',
  },
  {
    name: 'Phan Huyền Trân',
    role: 'Finance & Business Executive',
    roleClass: 'biz',
    image: 'phan_huyen_tran.jpg',
  },
  {
    name: 'Nguyễn Quang Anh',
    role: 'Front-End Developer',
    roleClass: 'dev',
    image: 'con_cho_ngu_dan.jpg',
  },
  {
    name: 'Trần Bảo Lâm',
    role: 'Back-End Developer',
    roleClass: 'dev',
    image: 'tran_bao_lam.jpg',
  },
];

const bottomTeamMember = {
  name: 'Nguyễn Đức Dương',
  role: 'Back-End & Algorithm Engineer',
  roleClass: 'dev',
  image: 'nguyen_duc_duong.jpg',
};

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function TeamCard({ member }) {
  return (
    <div className="team-card fade-in">
      <div className="team-avatar">
        <img src={imageUrl(member.image)} alt={member.name} />
      </div>
      <div className="team-info">
        <div className="team-name">{member.name}</div>
        <div className={`team-role ${member.roleClass}`}>{member.role}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  useDocumentTitle('Về Chúng Tôi | DoRentMe');
  useFadeIn('.about-page');

  return (
    <div className="about-page">
      <section className="hero">
        <div className="hero-icon">
          <PeopleIcon />
        </div>
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
              Tại DoRentMe, sứ mệnh của chúng tôi là <strong>dân chủ hóa thời trang cá nhân</strong>. Chúng tôi phá vỡ rào cản rằng chỉ người nổi tiếng mới có stylist riêng. Bằng cách sử dụng Trí Tuệ Nhân Tạo tiên tiến, DoRentMe mang đến những lời khuyên phối đồ chuyên nghiệp, cá nhân hóa, và tức thì cho bất kỳ ai, ở bất cứ đâu.
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
        <p className="sub">DoRentMe được xây dựng trên ba trụ cột công nghệ chính để mang lại trải nghiệm thời trang toàn diện cho bạn.</p>
        <div className="tech-grid">
          {techCards.map((card) => (
            <div className="tech-card fade-in" key={card.title}>
              <div className="tech-card-bar" />
              <div className="tech-card-body">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="team">
        <div className="team-header fade-in">
          <span className="section-tag">Con người</span>
          <h2>Gặp Gỡ Đội Ngũ</h2>
          <p>Những con người đứng sau DoRentMe — đam mê thời trang và công nghệ.</p>
        </div>
        <div className="team-grid">
          {teamMembers.map((member) => <TeamCard member={member} key={member.name} />)}
        </div>
        <div className="team-grid-bottom">
          <TeamCard member={bottomTeamMember} />
        </div>
      </section>
    </div>
  );
}
