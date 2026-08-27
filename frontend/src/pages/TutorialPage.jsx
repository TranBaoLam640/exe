import { useState } from 'react';
import FAQItem from '../components/ui/FAQItem.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const channelCards = [
  ['zalo', '💬', 'Thuê qua Zalo', ['Nhắn Zalo số 0934 907 714 với ảnh/tên trang phục muốn thuê', 'Xác nhận size, ngày nhận và ngày trả đồ', 'Chuyển khoản tiền cọc để giữ lịch', 'Nhận đồ tại shop hoặc qua shipper', 'Sau khi dùng xong, gửi lại qua bưu điện và nhắn mã vận đơn'], '🚚 Ship toàn quốc'],
  ['facebook', '📘', 'Thuê qua Facebook', ['Inbox Fanpage DoRentMe với ảnh/tên trang phục muốn thuê', 'Nhân viên tư vấn size, mẫu phù hợp và báo giá chi tiết', 'Xác nhận ngày nhận, ngày trả và chuyển khoản cọc', 'Nhận đồ kèm video/ảnh tình trạng trước khi giao', 'Trả đồ đúng hẹn và nhắn mã vận đơn'], '💬 Phản hồi nhanh'],
  ['direct', '🏠', 'Thuê trực tiếp tại shop', ['Ghé shop tại 195/9-11 Nguyễn Văn Thương, Bình Thạnh', 'Thử đồ, chọn size và được tư vấn phối đồ', 'Xác nhận ngày thuê, thanh toán tiền thuê + cọc', 'Nhận đồ ngay tại quầy', 'Trả đồ tại shop đúng hẹn'], '⏰ 9:00 - 20:00 mỗi ngày'],
];

const rules = [
  ['📅', 'Gói thuê 3 ngày', 'Gồm ngày thuê, ngày mặc, ngày trả. Trả muộn phụ thu theo chính sách hiện tại.'],
  ['⏱', 'Gói thuê 24h', 'Phù hợp cho chụp ảnh hoặc sự kiện một ngày.'],
  ['🧺', 'Không cần giặt', 'Shop sẽ xử lý vệ sinh sau khi nhận lại đồ.'],
  ['⚠', 'Bảo quản cẩn thận', 'Không tự ý sửa, bóp hay giặt trang phục.'],
  ['💳', 'Tiền cọc', 'Đặt cọc bằng giá thuê để giữ lịch và hoàn cọc nếu đồ nguyên vẹn.'],
  ['📦', 'Đổi lịch', 'Hỗ trợ đổi lịch khi báo trước tối thiểu 3 ngày.'],
];

const faqs = [
  ['Thuê bao lâu thì phù hợp?', 'Có 2 gói: 24h cho sự kiện ngắn và 3 ngày cho lịch trình dài hơn.'],
  ['Shop có ship tận nơi không?', 'Có, DoRentMe hỗ trợ ship đơn thuê toàn quốc qua đơn vị vận chuyển.'],
  ['Nếu đồ bị hỏng hoặc vấy bẩn thì sao?', 'Vết bẩn nhẹ không phụ thu; hư hỏng nặng xử lý theo giá trị sản phẩm.'],
  ['Có được đổi mẫu sau khi đặt không?', 'Shop hỗ trợ đổi lịch khi báo trước; đổi mẫu phụ thuộc tình trạng giữ mẫu.'],
  ['Thời gian thuê tính từ lúc nào?', 'Tính từ khi bạn nhận đồ đến khi gửi mã vận đơn hoặc trả trực tiếp tại shop.'],
];

export default function TutorialPage() {
  useDocumentTitle('Hướng Dẫn Thuê | DoRentMe');
  const [open, setOpen] = useState(new Set());

  function toggle(index) {
    const next = new Set(open);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setOpen(next);
  }

  return (
    <div className="tutorial-page page-wrapper">
      <div className="hero-strip">
        <h1>Hướng Dẫn Thuê Trang Phục</h1>
        <p>Chọn hình thức thuê phù hợp - đặt lịch nhanh, nhận đồ đẹp, trả dễ dàng.</p>
        <div className="divider" />
      </div>
      <div className="page-inner">
        <h2 className="section-title">3 Hình Thức Thuê</h2>
        <div className="channel-grid">
          {channelCards.map(([type, icon, title, steps, badge]) => (
            <div className={`channel-card ${type}`} key={title}>
              <div className="channel-icon">{icon}</div>
              <h3>{title}</h3>
              <ul className="step-list">{steps.map((step, index) => <li key={step}><span className="step-num">{index + 1}</span>{step}</li>)}</ul>
              <span className="channel-badge">{badge}</span>
            </div>
          ))}
        </div>
        <h2 className="section-title">Lưu Ý Khi Thuê</h2>
        <div className="rules-grid">
          {rules.map(([icon, title, text]) => <div className="rule-card" key={title}><div className="rule-icon">{icon}</div><div><h4>{title}</h4><p>{text}</p></div></div>)}
        </div>
        <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <FAQItem key={question} question={question} answer={answer} open={open.has(index)} onToggle={() => toggle(index)} />
          ))}
        </div>
        <div className="cta-box"><h3>Sẵn sàng thuê rồi?</h3><p>Khám phá hàng trăm bộ trang phục đẹp đang chờ bạn tại DoRentMe.</p><a href="/shop.html" className="cta-btn">Xem bộ sưu tập ngay →</a></div>
      </div>
    </div>
  );
}
