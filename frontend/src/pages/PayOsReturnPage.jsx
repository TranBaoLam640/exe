import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchCustomerPayment, fetchCustomerPaymentTransactions } from '../features/orders/orderApi.js';

export default function PayOsReturnPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const [payment, setPayment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return undefined;
    let active = true;
    Promise.all([fetchCustomerPayment(orderId), fetchCustomerPaymentTransactions(orderId)])
      .then(([paymentResult, transactionResult]) => {
        if (active) { setPayment(paymentResult); setTransactions(transactionResult); }
      })
      .catch(() => { if (active) setError('Không thể tải trạng thái thanh toán.'); });
    return () => { active = false; };
  }, [orderId]);

  const latest = transactions[0];
  const title = payment?.status === 'paid' ? 'Thanh toán thành công' : payment?.status === 'pending' ? 'Thanh toán đang được xác nhận' : 'Trạng thái thanh toán';
  return (
    <div className="order-tracking-page">
      <div className="tracking-head"><h1>{title}</h1></div>
      <section className="tracking-card">
        {error ? <p>{error}</p> : null}
        {payment ? <>
          <div className="tracking-info-line">Đơn hàng: <b>{payment.orderId}</b></div>
          <div className="tracking-info-line">Thanh toán: <b>{payment.status}</b></div>
          {latest ? <div className="tracking-info-line">Giao dịch PayOS: <b>{latest.status}</b></div> : null}
          <p>Trạng thái được lấy từ máy chủ. Việc quay lại trang này không tự xác nhận thanh toán.</p>
        </> : !error ? <p>Đang tải trạng thái thanh toán...</p> : null}
        {orderId ? <Link className="btn-return" to={`/orders/${encodeURIComponent(orderId)}`}>Xem đơn hàng</Link> : <Link className="btn-return" to="/orders">Xem đơn hàng</Link>}
      </section>
    </div>
  );
}
