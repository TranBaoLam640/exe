import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const policyBlocks = [
  ['Chính sách chung', ['Gói thuê 3 ngày gồm ngày thuê, ngày mặc, ngày trả.', 'Gói thuê 24h cho nhu cầu chụp ảnh hoặc sự kiện ngắn.', 'Trả muộn cần thông báo trước và có thể phát sinh phụ phí.']],
  ['Chính sách về sản phẩm', ['Khách không cần giặt sau khi sử dụng sản phẩm.', 'Vết bẩn nhẹ được xử lý miễn phí; hư hỏng nặng xử lý theo tiền cọc.', 'Không tự ý sửa, bóp hoặc giặt trang phục trong thời gian thuê.']],
];

const termBlocks = [
  ['Chấp thuận điều khoản', 'Khi truy cập và sử dụng website DoRentMe, bạn đồng ý bị ràng buộc bởi các điều khoản và điều kiện này.'],
  ['Điều kiện sử dụng', 'Người dùng cần cung cấp thông tin chính xác và trung thực khi đặt thuê trang phục.'],
  ['Tài khoản & bảo mật', 'Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình và thông báo khi phát hiện truy cập trái phép.'],
  ['Quyền & nghĩa vụ của khách hàng', 'Thanh toán đầy đủ, bảo quản trang phục cẩn thận và hoàn trả đúng hạn.'],
  ['Quyền & nghĩa vụ của DoRentMe', 'Cung cấp trang phục đúng mô tả, đảm bảo vệ sinh và hỗ trợ khách hàng trong quá trình thuê.'],
  ['Bảo mật thông tin cá nhân', 'DoRentMe không bán thông tin cá nhân và chỉ dùng dữ liệu cho mục đích xử lý đơn thuê, hỗ trợ khách hàng.'],
  ['Giới hạn trách nhiệm', 'DoRentMe không chịu trách nhiệm cho các trường hợp ngoài tầm kiểm soát như thiên tai hoặc sự cố vận chuyển.'],
  ['Giải quyết tranh chấp', 'Mọi tranh chấp phát sinh được ưu tiên giải quyết thông qua thương lượng và hòa giải.'],
];

function LegalPageLayout({ title, subtitle, children }) {
  return (
    <div className="legal-page">
      <div className="page-wrapper">
        <div className="page-inner">
          <div className="page-title"><h1>{title}</h1><p>{subtitle}</p><div className="divider" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PolicyPage() {
  useDocumentTitle('Chính Sách | DoRentMe');
  return (
    <LegalPageLayout title="Chính Sách" subtitle="Các quy định và điều khoản thuê trang phục tại DoRentMe">
      {policyBlocks.map(([heading, items]) => (
        <div className="policy-block" key={heading}>
          <h2>{heading}</h2>
          <div className="policy-section">
            <h3>Nội dung</h3>
            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="highlight-box"><strong>Lưu ý:</strong> Mọi tình trạng sản phẩm được ghi nhận trước khi giao.</div>
          </div>
        </div>
      ))}
    </LegalPageLayout>
  );
}

export function TermsPage() {
  useDocumentTitle('Điều Khoản Sử Dụng | DoRentMe');
  return (
    <LegalPageLayout title="Điều Khoản Sử Dụng" subtitle="Vui lòng đọc kỹ trước khi sử dụng dịch vụ của DoRentMe">
      <p className="updated">Cập nhật lần cuối: tháng 6, 2026</p>
      {termBlocks.map(([heading, text], index) => (
        <div className="term-block" key={heading}>
          <h2><span className="num">{index + 1}</span> {heading}</h2>
          <p>{text}</p>
        </div>
      ))}
    </LegalPageLayout>
  );
}
