import { depositProgress } from '../features/orders/depositProgress.js';

export default function DepositReturnProgress({ order, refunds, admin = false }) {
  const { step, complete, refund } = depositProgress(order, refunds);
  const labels = ['Shipper giao hàng trả về shop', 'Shop kiểm tra hàng', 'Hoàn cọc và gửi ảnh chuyển khoản', 'Khách xem bằng chứng hoàn cọc'];
  const messages = [
    'Đang chờ shipper giao hàng trả về shop. Tiền cọc chưa được hoàn ở bước này.',
    admin ? 'Hàng đã về shop. Kiểm tra từng món hàng bên dưới, sau đó tạo khoản hoàn cọc.' : 'Hàng đã được trả về shop. Shop đang kiểm tra tình trạng hàng trước khi hoàn cọc.',
    admin ? 'Chuyển khoản số tiền hoàn cọc, chọn ảnh giao dịch thành công và nhấn “Xác nhận đã chuyển khoản và gửi ảnh” bên dưới.' : refund?.status === 'completed' ? 'Shop đã xác nhận hoàn cọc nhưng chưa gửi ảnh chuyển khoản. Đang chờ shop bổ sung bằng chứng.' : 'Shop đang xử lý hoàn cọc. Ảnh chuyển khoản sẽ hiển thị bên dưới sau khi shop gửi.',
    admin ? 'Đã hoàn cọc và gửi bằng chứng. Khách có thể xem ảnh trong trang theo dõi đơn hàng.' : 'Đã hoàn cọc và nhận ảnh chuyển khoản từ shop. Bạn có thể xem bằng chứng bên dưới.',
  ];
  return <section className={`deposit-return-progress${complete ? ' is-complete' : ''}`}>
    <h3>{complete ? 'Đã hoàn cọc và gửi bằng chứng' : 'Trả hàng và hoàn tiền cọc'}</h3>
    <ol>{labels.map((label, index) => <li key={label} className={index < step ? 'is-done' : index === step ? 'is-current' : ''} aria-current={index === step ? 'step' : undefined}><span aria-hidden="true">{index < step ? '✓' : index + 1}</span>{label}</li>)}</ol>
    <p role="status">{messages[step]}</p>
  </section>;
}
