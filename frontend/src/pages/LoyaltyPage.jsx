import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const reasons = [
  {
    icon: '💰',
    title: 'Tiết kiệm thực sự',
    text: 'Điểm tích lũy quy đổi thành voucher giảm giá trực tiếp vào đơn thuê tiếp theo. Thuê càng nhiều, giảm càng sâu.',
  },
  {
    icon: '👑',
    title: 'Đặc quyền độc quyền',
    text: 'Thành viên hạng cao được ưu tiên đặt trước bộ sưu tập mới, truy cập sớm flash sale và tư vấn riêng từ stylist.',
  },
  {
    icon: '🎁',
    title: 'Quà tặng milestone',
    text: 'Đạt mỗi mốc điểm quan trọng, bạn nhận ngay quà tặng vật lý từ DoRentMe — phụ kiện, voucher và hơn thế nữa.',
  },
];

const earnRules = [
  { icon: '👗', points: '+1đ', text: <>Mỗi 1.000 vnd<br />tiền thuê trang phục</> },
  { icon: '⭐', points: '+50đ', text: <>Đánh giá sau<br />mỗi lần thuê</> },
  { icon: '👥', points: '+200đ', text: <>Giới thiệu bạn bè<br />đăng ký thành công</> },
  { icon: '🎂', points: '+500đ', text: <>Sinh nhật thành viên<br />(tặng mỗi năm)</> },
];

const tiers = [
  {
    key: 'gold',
    icon: '✦',
    name: 'Gold',
    points: 'Từ 0 — 999 điểm',
    title: '✦ Quyền lợi Gold',
    benefits: [
      <><strong>Giảm 5%</strong> tổng đơn thuê khi quy đổi điểm</>,
      <><strong>Sinh nhật +500 điểm</strong> tự động mỗi năm</>,
      <>Ưu tiên hỗ trợ qua <strong>Zalo & Fanpage</strong></>,
      <>Thông báo sớm về <strong>bộ sưu tập mới</strong></>,
      <>Tặng <strong>túi vải DoRentMe</strong> khi đạt 500 điểm</>,
    ],
  },
  {
    key: 'platinum',
    icon: '◈',
    name: 'Platinum',
    points: 'Từ 1.000 — 4.999 điểm',
    title: '◈ Quyền lợi Platinum',
    benefits: [
      <><strong>Giảm 12%</strong> tổng đơn thuê khi quy đổi điểm</>,
      <><strong>Miễn phí ship</strong> 1 chiều khi thuê từ 2 món</>,
      <>Đặt lịch trước <strong>24h ưu tiên</strong> cho BST mới</>,
      <>Tư vấn phối đồ <strong>1-1 với stylist</strong> (1 lần/tháng)</>,
      <>Tặng <strong>combo phụ kiện</strong> khi đạt 2.000 điểm</>,
      <>Voucher <strong>200.000 vnd</strong> khi đạt 4.000 điểm</>,
    ],
  },
  {
    key: 'diamond',
    icon: '◆',
    name: 'Diamond',
    points: 'Từ 5.000 điểm trở lên',
    title: '◆ Quyền lợi Diamond',
    benefits: [
      <><strong>Giảm 22%</strong> tổng đơn thuê khi quy đổi điểm</>,
      <><strong>Miễn phí ship 2 chiều</strong> không giới hạn số đơn</>,
      <>Truy cập <strong>BST độc quyền</strong> chưa ra mắt</>,
      <>Tư vấn stylist <strong>không giới hạn</strong> số lần</>,
      <>Gia hạn thuê miễn phí <strong>+1 ngày</strong> mỗi đơn</>,
      <>Quà tặng <strong>cao cấp hàng quý</strong> từ DoRentMe</>,
      <>Voucher <strong>500.000 vnd</strong> khi đạt 5.000 điểm</>,
    ],
  },
];

const milestones = [
  {
    points: '500 điểm',
    title: 'Gold — Mốc đầu tiên',
    icon: '✦',
    tone: 'gold',
    gift: <><strong>Túi vải canvas DoRentMe</strong> thêu logo — kỷ niệm chuyến thuê đầu tiên của bạn.</>,
  },
  {
    points: '1.000 điểm',
    title: 'Lên hạng Platinum',
    icon: '◈',
    tone: 'plat',
    flip: true,
    gift: <><strong>Combo phụ kiện</strong> (vòng cổ ngọc trai + bờm) — trị giá 200.000 vnd.</>,
  },
  {
    points: '2.000 điểm',
    title: 'Platinum — Mốc giữa',
    icon: '◈',
    tone: 'plat',
    gift: <><strong>Voucher 200.000 vnd</strong> + 1 buổi tư vấn phối đồ riêng với stylist DoRentMe.</>,
  },
  {
    points: '4.000 điểm',
    title: 'Platinum — Mốc cuối',
    icon: '◈',
    tone: 'plat',
    flip: true,
    gift: <><strong>Voucher 350.000 vnd</strong> áp dụng cho đơn thuê tiếp theo không giới hạn giá trị.</>,
  },
  {
    points: '5.000 điểm',
    title: 'Lên hạng Diamond',
    icon: '◆',
    tone: 'diamond',
    gift: <><strong>Voucher 500.000 vnd + hộp quà DoRentMe Premium</strong> — nước hoa, khăn lụa và thẻ cảm ơn viết tay.</>,
  },
  {
    points: '10.000 điểm',
    title: 'Diamond — VIP tuyệt đối',
    icon: '◆',
    tone: 'diamond',
    flip: true,
    gift: <><strong>Buổi chụp ảnh concept miễn phí</strong> tại studio hợp tác của DoRentMe — trị giá 1.500.000 vnd.</>,
  },
];

const redemptions = [
  { points: '100đ', value: 'Voucher 50.000 vnd', desc: 'Áp dụng cho đơn từ 200.000 vnd' },
  { points: '250đ', value: 'Voucher 150.000 vnd', desc: 'Áp dụng cho đơn từ 400.000 vnd' },
  { points: '500đ', value: 'Voucher 350.000 vnd', desc: 'Áp dụng không giới hạn đơn' },
];

function TierCard({ tier }) {
  const tone = tier.key === 'platinum' ? 'plat' : tier.key;

  return (
    <div className="mem-card-wrap fade-in">
      <div className={`mem-card ${tier.key}`}>
        <div className="card-top">
          <div className="card-brand">DoRentMe</div>
          <div className="card-tier-icon">{tier.icon}</div>
        </div>
        <div className="card-chip" />
        <div className="card-bottom">
          <div className="card-tier-name">{tier.name}</div>
          <div className="card-points-req">{tier.points}</div>
        </div>
      </div>
      <div className="benefits-box">
        <div className={`tier-title ${tone}-text`}>{tier.title}</div>
        {tier.benefits.map((benefit, index) => (
          <div className="benefit-item" key={index}>
            <div className={`benefit-dot ${tone}-dot`} />
            <div className="benefit-text">{benefit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Milestone({ milestone }) {
  const summary = (
    <>
      <div className={`ms-pts ${milestone.tone}-text`}>{milestone.points}</div>
      <div className="ms-title">{milestone.title}</div>
    </>
  );
  const gift = <div className={`ms-gift ${milestone.tone}-border`}>🎁 {milestone.gift}</div>;

  return (
    <div className="milestone fade-in">
      <div className="milestone-left">{milestone.flip ? gift : summary}</div>
      <div className="milestone-center"><div className={`ms-dot ${milestone.tone}-bg`}>{milestone.icon}</div></div>
      <div className="milestone-right">{milestone.flip ? summary : gift}</div>
    </div>
  );
}

export default function LoyaltyPage() {
  useDocumentTitle('Thành Viên & Tích Điểm | DoRentMe');
  useFadeIn('.loyalty-page');

  return (
    <div className="loyalty-page">
      <section className="loyalty-hero">
        <div className="hero-badge">✦ Chương trình thành viên</div>
        <h1>Tích Điểm — Nhận <span>Đặc Quyền</span></h1>
        <p>Mỗi lần thuê là một bước tiến lên hạng thẻ cao hơn. Tích lũy điểm để đổi voucher, nhận quà và tận hưởng đặc quyền độc quyền.</p>
        <div className="hero-stats">
          <div className="hero-stat"><div className="num">1đ</div><div className="lbl">= 1.000 vnd chi tiêu</div></div>
          <div className="hero-stat"><div className="num">3 hạng</div><div className="lbl">thẻ thành viên</div></div>
          <div className="hero-stat"><div className="num">∞</div><div className="lbl">ưu đãi tích lũy</div></div>
        </div>
      </section>

      <section className="loyalty-why">
        <div className="section-label">Tại sao nên tham gia?</div>
        <h2 className="section-h2">Gắn Kết — Tiết Kiệm — Được Trân Trọng</h2>
        <p className="section-sub">Chương trình thành viên không chỉ là giảm giá — đó là cách DoRentMe nói lời cảm ơn với những khách hàng trung thành nhất.</p>
        <div className="why-grid">
          {reasons.map((reason) => (
            <div className="why-card fade-in" key={reason.title}>
              <div className="why-icon">{reason.icon}</div>
              <h4>{reason.title}</h4>
              <p>{reason.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="earn-section">
        <div className="section-label">Cách tích điểm</div>
        <h2 className="section-h2">Mỗi Hành Động Đều Có Giá Trị</h2>
        <p className="section-sub">Điểm được cộng tự động sau mỗi giao dịch thành công.</p>
        <div className="earn-grid">
          {earnRules.map((rule) => (
            <div className="earn-card fade-in" key={rule.points + rule.icon}>
              <div className="earn-icon">{rule.icon}</div>
              <div className="earn-pts">{rule.points}</div>
              <div className="earn-desc">{rule.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cards-section">
        <div className="section-label">Hạng thành viên</div>
        <h2 className="section-h2">Chọn Hạng Thẻ Của Bạn</h2>
        <div className="cards-grid">
          {tiers.map((tier) => <TierCard tier={tier} key={tier.key} />)}
        </div>
      </section>

      <section className="milestone-section">
        <div className="section-label">Mốc thưởng</div>
        <h2 className="section-h2">Quà Tặng Theo Mốc Điểm</h2>
        <div className="timeline">
          {milestones.map((milestone) => <Milestone milestone={milestone} key={milestone.points} />)}
        </div>
      </section>

      <section className="redeem-section">
        <div className="section-label">Quy đổi điểm</div>
        <h2 className="section-h2">Điểm → Voucher Giảm Giá</h2>
        <p className="section-sub">Dùng điểm tích lũy để đổi voucher áp dụng ngay vào đơn thuê tiếp theo.</p>
        <div className="redeem-grid">
          {redemptions.map((item) => (
            <div className="redeem-card fade-in" key={item.points}>
              <div className="redeem-pts">{item.points} <span>điểm</span></div>
              <div className="redeem-arrow">↓</div>
              <div className="redeem-value">{item.value}</div>
              <div className="redeem-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Bắt Đầu Tích Điểm Ngay Hôm Nay</h2>
        <p>Mỗi lần thuê là một bước tiến đến đặc quyền cao hơn. Đăng ký tài khoản miễn phí và bắt đầu hành trình cùng DoRentMe.</p>
        <Link to="/shop" className="cta-btn">Thuê ngay — Tích điểm ngay →</Link>
      </section>
    </div>
  );
}
