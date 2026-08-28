import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFadeIn } from '../hooks/useFadeIn.js';

const faqs = [
  {
    question: 'DoRentMe hoạt động như thế nào?',
    answer: 'DoRentMe sử dụng AI để phân tích phong cách, vóc dáng và hoàn cảnh của bạn, sau đó gợi ý và cho thuê trang phục phù hợp nhất.',
  },
  {
    question: 'Thời gian thuê tối thiểu là bao lâu?',
    answer: 'Thời gian thuê tối thiểu là 3 ngày. Bạn có thể gia hạn thêm với mức phí theo ngày linh hoạt.',
  },
  {
    question: 'Nếu trang phục bị hư hỏng thì sao?',
    answer: 'Hao mòn tự nhiên được miễn phí. Hư hỏng nặng sẽ được xử lý qua tiền đặt cọc đã ký kết trong hợp đồng.',
  },
  {
    question: 'Giao hàng có đến tận nơi không?',
    answer: 'Có! Chúng tôi giao và nhận hàng tận nơi trong nội thành TP.HCM và Hà Nội.',
  },
  {
    question: 'Tôi có thể thử đồ trước khi thuê không?',
    answer: 'Có — tính năng thử đồ AI 3D cho phép bạn xem trang phục trên avatar cá nhân hoá.',
  },
];

export default function ContactPage() {
  useDocumentTitle('Liên Hệ | DoRentMe');
  useFadeIn('.contact-page');
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  function toggleFaq(index) {
    setOpenFaq((current) => (current === index ? null : index));
  }

  function submitForm(event) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <div className="contact-page">
      <section className="hero">
        <span className="hero-badge">✉ Luôn sẵn sàng hỗ trợ</span>
        <h1>Liên Hệ</h1>
        <p>Đội ngũ DoRentMe luôn sẵn sàng lắng nghe và hỗ trợ bạn bất cứ lúc nào.</p>
      </section>

      <div className="contact-body">
        <div className="contact-inner">
          <div className="faq-col fade-in">
            <h2>Câu Hỏi Thường Gặp</h2>
            <p className="sub">Tìm câu trả lời nhanh cho các thắc mắc phổ biến nhất.</p>

            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div className={`faq-item ${open ? 'open' : ''}`} key={faq.question}>
                  <button className="faq-question" type="button" aria-expanded={open} onClick={() => toggleFaq(index)}>
                    {faq.question}
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">{faq.answer}</div>
                </div>
              );
            })}
          </div>

          <div className="form-col fade-in">
            <h2>Bạn có câu hỏi?</h2>
            <p className="sub">Đội ngũ DoRentMe luôn sẵn sàng lắng nghe và hỗ trợ bạn trong thời gian sớm nhất.</p>
            <p className="feedback-inline">
              Bạn cũng có thể <a href="https://forms.gle/GFz1dVHmityymatcA" target="_blank" rel="noopener noreferrer">đóng góp ý kiến tại đây! </a>.Chúng mình chưa hoàn thiện sản phẩm nên form sẽ không hoạt động mong các bạn thông cảm nhe
            </p>
            <form onSubmit={submitForm}>
              <div className="form-group">
                <label>
                  Tên của bạn <span>*</span>
                </label>
                <input type="text" placeholder="Nguyễn Văn A" required />
              </div>
              <div className="form-group">
                <label>
                  Email <span>*</span>
                </label>
                <input type="email" placeholder="email@example.com" required />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="tel" placeholder="0901 234 567" />
              </div>
              <div className="form-group">
                <label>
                  Nội dung <span>*</span>
                </label>
                <textarea placeholder="Mô tả câu hỏi hoặc yêu cầu của bạn..." required />
              </div>
              <button type="submit" className="btn-submit">Gửi tin nhắn</button>
              {submitted ? <div className="success-msg">✓ Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong 24h.</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
