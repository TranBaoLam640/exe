import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { login } from '../features/auth/authService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function LoginPage() {
  useDocumentTitle('Đăng Nhập | DoRentMe');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/';

  async function submit(event) {
    event.preventDefault();
    setInvalid(false);
    setMessage(null);
    setSubmitting(true);

    const result = await login(email, password);
    if (!result.ok) {
      setSubmitting(false);
      setInvalid(true);
      setMessage({ type: 'error', text: result.error });
      return;
    }

    setMessage({ type: 'success', text: 'Đăng nhập thành công! Đang chuyển hướng...' });
    window.setTimeout(() => {
      window.location.href = redirectTo;
    }, 500);
  }

  return (
    <div className="auth-page login-page">
      <div className="auth-card">
        <div className="auth-card-icon">👤</div>
        <h1>Chào mừng trở lại</h1>
        <p className="auth-sub">Đăng nhập để tiếp tục theo dõi đơn hàng & thông tin của bạn.</p>

        {message ? <div className={`auth-form-msg ${message.type}`}>{message.text}</div> : null}

        <form onSubmit={submit}>
          <div className={`auth-form-row ${invalid ? 'invalid' : ''}`}>
            <label htmlFor="loginEmail">Email</label>
            <input
              autoComplete="email"
              id="loginEmail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@email.com"
              type="email"
              value={email}
            />
          </div>
          <div className={`auth-form-row ${invalid ? 'invalid' : ''}`}>
            <label htmlFor="loginPassword">Mật khẩu</label>
            <input
              autoComplete="current-password"
              id="loginPassword"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu"
              type="password"
              value={password}
            />
          </div>
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
        <Link className="auth-guest-link" to="/shop">Tiếp tục mua sắm không cần tài khoản →</Link>
        <Link className="auth-admin-link" to="/admin">🔐 Bạn là admin? Đăng nhập ở đây →</Link>
      </div>
    </div>
  );
}
