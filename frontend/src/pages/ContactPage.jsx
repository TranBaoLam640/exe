import { useState } from 'react';
import FAQItem from '../components/ui/FAQItem.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const faqs = [
  ['DoRentMe hoạt động như thế nào?', 'DoRentMe sử dụng AI để phân tích phong cách, vóc dáng và hoàn cảnh của bạn, sau đó gợi ý và cho thuê trang phục phù hợp nhất.'],
  ['Thời gian thuê tối thiểu là bao lâu?', 'Thời gian thuê tối thiểu là 3 ngày. Bạn có thể gia hạn thêm với mức phí theo ngày linh hoạt.'],
  ['Nếu trang phục bị hư hỏng thì sao?', 'Hao mòn tự nhiên được miễn phí. Hư hỏng nặng sẽ được xử lý qua tiền đặt cọc đã ký kết trong hợp đồng.'],
  ['Giao hàng có đến tận nơi không?', 'Có! Chúng tôi giao và nhận hàng tận nơi trong nội thành TP.HCM và Hà Nội.'],
  ['Tôi có thể thử đồ trước khi thuê không?', 'Có - tính năng thử đồ AI 3D cho phép bạn xem trang phục trên avatar cá nhân hoá.'],
];

export default function ContactPage() {
  useDocumentTitle('Liên Hệ | DoRentMe');
  useFadeIn('.contact-page');
  const [openIndex, setOpenIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  function submitForm(event) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <div className="contact-page">
      <section className="legacy-hero contact-hero">
        <span className="hero-badge">✉ Luôn sẵn sàng hỗ trợ</span>
        <h1>Liên Hệ</h1>
        <p>Đội ngũ DoRentMe luôn sẵn sàng lắng nghe và hỗ trợ bạn bất cứ lúc nào.</p>
      </section>
      <div className="contact-body">
        <div className="contact-inner">
          <div className="faq-col fade-in">
            <h2>Câu Hỏi Thường Gặp</h2>
            <p className="sub">Tìm câu trả lời nhanh cho các thắc mắc phổ biến nhất.</p>
            {faqs.map(([question, answer], index) => (
              <FAQItem
                answer={answer}
                key={question}
                open={openIndex === index}
                question={question}
                onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
              />
            ))}
          </div>
          <div className="form-col fade-in">
            <h2>Bạn có câu hỏi?</h2>
            <p className="sub">Đội ngũ DoRentMe luôn sẵn sàng lắng nghe và hỗ trợ bạn trong thời gian sớm nhất.</p>
            <p className="feedback-inline">
              Bạn cũng có thể <a href="https://forms.gle/GFz1dVHmityymatcA" target="_blank" rel="noopener noreferrer">đóng góp ý kiến tại đây!</a>
              . Chúng mình chưa hoàn thiện sản phẩm nên form sẽ không hoạt động mong các bạn thông cảm nhe.
            </p>
            <form onSubmit={submitForm}>
              <div className="form-group"><label>Tên của bạn <span>*</span></label><input type="text" placeholder="Nguyễn Văn A" required /></div>
              <div className="form-group"><label>Email <span>*</span></label><input type="email" placeholder="email@example.com" required /></div>
              <div className="form-group"><label>Số điện thoại</label><input type="tel" placeholder="0901 234 567" /></div>
              <div className="form-group"><label>Nội dung <span>*</span></label><textarea placeholder="Mô tả câu hỏi hoặc yêu cầu của bạn..." required /></div>
              <button type="submit" className="btn-submit">Gửi tin nhắn</button>
              <div className="success-msg" style={{ display: submitted ? 'block' : 'none' }}>✓ Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong 24h.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
