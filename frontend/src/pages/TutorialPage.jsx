import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const channels = [
  {
    className: 'zalo',
    icon: '💬',
    title: 'Thuê qua Zalo',
    badge: '📦 Ship toàn quốc',
    steps: [
      <>Nhắn Zalo số <strong>0934 907 714</strong> với ảnh/tên trang phục muốn thuê</>,
      'Xác nhận size, ngày nhận và ngày trả đồ',
      'Chuyển khoản tiền cọc (bằng giá thuê) để giữ lịch',
      'Nhận đồ tại shop hoặc qua shipper, kèm ảnh tình trạng đồ',
      'Sau khi dùng xong, gửi lại qua bưu điện + nhắn mã vận đơn',
    ],
  },
  {
    className: 'facebook',
    icon: '📘',
    title: 'Thuê qua Facebook',
    badge: '💬 Phản hồi nhanh',
    steps: [
      'Inbox Fanpage DoRentMe với ảnh/tên trang phục muốn thuê',
      'Nhân viên tư vấn size, mẫu phù hợp và báo giá chi tiết',
      'Xác nhận ngày nhận, ngày trả và chuyển khoản cọc',
      'Nhận đồ kèm video/ảnh quay tình trạng trước khi giao',
      'Trả đồ đúng hẹn, nhắn mã vận đơn cho shop qua Fanpage',
    ],
  },
  {
    className: 'direct',
    icon: '🏪',
    title: 'Thuê trực tiếp tại shop',
    badge: '⏰ 9:00 – 20:00 mỗi ngày',
    steps: [
      'Ghé trực tiếp shop tại 195/9-11 Nguyễn Văn Thương, Bình Thạnh',
      'Thử đồ, chọn size — nhân viên hỗ trợ tư vấn phối đồ tận tình',
      'Xác nhận ngày thuê, thanh toán tiền thuê + cọc tại quầy',
      'Nhận đồ ngay, shop chụp ảnh tình trạng đồ trước khi giao',
      'Trả đồ tại shop đúng hẹn, hoàn cọc nếu đồ nguyên vẹn',
    ],
  },
];

const rules = [
  {
    icon: '📅',
    title: 'Gói thuê 3 ngày',
    text: 'Gồm ngày thuê, ngày mặc, ngày trả (3 ngày 2 đêm). Trả muộn phụ thu thêm 10% giá thuê/ngày.',
  },
  {
    icon: '⏱️',
    title: 'Gói thuê 24h',
    text: 'Nhận và hoàn trả trong vòng 24 giờ kể từ khi nhận sản phẩm. Phù hợp chụp ảnh, sự kiện 1 ngày.',
  },
  {
    icon: '🚿',
    title: 'Không cần giặt',
    text: 'Bạn không cần giặt sau khi sử dụng. Shop sẽ xử lý vệ sinh sau khi nhận lại đồ.',
  },
  {
    icon: '⚠️',
    title: 'Bảo quản cẩn thận',
    text: 'Không tự ý sửa, bóp hay giặt trang phục. Hư hỏng nặng hoặc mất đồ phải chịu 100% giá trị sản phẩm.',
  },
  {
    icon: '💰',
    title: 'Tiền cọc',
    text: 'Đặt cọc bằng giá thuê để giữ lịch. Hoàn cọc sau khi trả đồ nguyên vẹn đúng hẹn.',
  },
  {
    icon: '🔄',
    title: 'Đổi lịch',
    text: 'Shop hỗ trợ đổi lịch khi khách báo trước tối thiểu 3 ngày. Không hỗ trợ đổi mẫu sau khi đã chốt.',
  },
];

const faqs = [
  {
    question: 'Thuê bao lâu thì phù hợp?',
    answer: <>Có 2 gói: <strong>Gói 24h</strong> phù hợp cho chụp ảnh, sự kiện 1 ngày. <strong>Gói 3 ngày</strong> (3 ngày 2 đêm) phù hợp cho các dịp lễ hội, tiệc kéo dài. Trên 3 ngày phụ thu thêm 50.000đ/ngày.</>,
  },
  {
    question: 'Shop có ship tận nơi không?',
    answer: 'Có! DoRentMe hỗ trợ ship đơn thuê toàn quốc qua bưu điện hoặc đơn vị vận chuyển. Phí ship do khách hàng chịu. Khi trả đồ, bạn gửi lại qua bưu điện và nhắn mã vận đơn cho shop.',
  },
  {
    question: 'Nếu đồ bị hỏng hoặc vấy bẩn thì sao?',
    answer: 'Vết bẩn nhẹ (mồ hôi, bụi) không phụ thu. Vết bẩn cần tẩy rửa phụ thu 30.000 – 100.000đ. Đồ bị rách, cháy hoặc hư hỏng nặng phải chịu 100% giá trị sản phẩm.',
  },
  {
    question: 'Có được đổi mẫu sau khi đặt không?',
    answer: 'Sau khi đã chốt mẫu, shop không hỗ trợ đổi sang mẫu khác. Tuy nhiên có thể đổi lịch nếu báo trước tối thiểu 3 ngày. Vui lòng chọn kỹ trước khi xác nhận.',
  },
  {
    question: 'Thời gian thuê tính từ lúc nào?',
    answer: 'Thời gian thuê bắt đầu khi bạn nhận được váy và kết thúc khi bạn gửi mã vận đơn trả hàng cho shop (hoặc trả trực tiếp tại shop).',
  },
];

export default function TutorialPage() {
  useDocumentTitle('Hướng Dẫn Thuê | DoRentMe');
  const [openFaqs, setOpenFaqs] = useState(() => new Set());

  function toggleFaq(index) {
    setOpenFaqs((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="tutorial-page">
      <div className="page-wrapper">
        <div className="hero-strip">
          <h1>Hướng Dẫn Thuê Trang Phục</h1>
          <p>Chọn hình thức thuê phù hợp — đặt lịch nhanh, nhận đồ đẹp, trả dễ dàng.</p>
          <div className="divider" />
        </div>

        <div className="page-inner">
          <div className="section-title">3 Hình Thức Thuê</div>
          <div className="channel-grid">
            {channels.map((channel) => (
              <div className={`channel-card ${channel.className}`} key={channel.title}>
                <div className="channel-icon">{channel.icon}</div>
                <h3>{channel.title}</h3>
                <ul className="step-list">
                  {channel.steps.map((step, index) => (
                    <li key={index}>
                      <span className="step-num">{index + 1}</span> {step}
                    </li>
                  ))}
                </ul>
                <span className="channel-badge">{channel.badge}</span>
              </div>
            ))}
          </div>

          <div className="section-title">Lưu Ý Khi Thuê</div>
          <div className="rules-grid">
            {rules.map((rule) => (
              <div className="rule-card" key={rule.title}>
                <div className="rule-icon">{rule.icon}</div>
                <div>
                  <h4>{rule.title}</h4>
                  <p>{rule.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="section-title">Câu Hỏi Thường Gặp</div>
          <div className="faq-list">
            {faqs.map((faq, index) => {
              const open = openFaqs.has(index);
              return (
                <div className={`faq-item ${open ? 'open' : ''}`} key={faq.question}>
                  <button className="faq-q" type="button" aria-expanded={open} onClick={() => toggleFaq(index)}>
                    {faq.question} <span className="faq-chevron">+</span>
                  </button>
                  <div className="faq-a">{faq.answer}</div>
                </div>
              );
            })}
          </div>

          <div className="cta-box">
            <h3>Sẵn sàng thuê rồi? 🎉</h3>
            <p>Khám phá hàng trăm bộ trang phục đẹp đang chờ bạn tại DoRentMe.</p>
            <a href="/shop.html" className="cta-btn">Xem bộ sưu tập ngay →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
