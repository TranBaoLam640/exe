import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { register } from '../features/auth/authService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
};

export default function RegisterPage() {
  useDocumentTitle('Đăng Ký | DoRentMe');
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(null);
  const [invalidConfirm, setInvalidConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setInvalidConfirm(false);
    setMessage(null);

    if (form.password !== form.confirm) {
      setInvalidConfirm(true);
      setMessage({ type: 'error', text: 'Mật khẩu nhập lại không khớp.' });
      return;
    }

    setSubmitting(true);
    const result = await register(form);
    if (!result.ok) {
      setSubmitting(false);
      setMessage({ type: 'error', text: result.error });
      return;
    }

    setMessage({ type: 'success', text: 'Đăng ký thành công! Đang chuyển hướng...' });
    window.setTimeout(() => {
      window.location.href = redirectTo;
    }, 700);
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-card">
        <div className="auth-card-icon">✨</div>
        <h1>Tạo tài khoản DoRentMe</h1>
        <p className="auth-sub">Đăng ký để lưu thông tin nhận đồ & theo dõi lịch sử thuê dễ dàng hơn.</p>

        {message ? <div className={`auth-form-msg ${message.type}`}>{message.text}</div> : null}

        <form onSubmit={submit}>
          <div className="auth-form-row">
            <label htmlFor="registerName">Họ và tên</label>
            <input
              autoComplete="name"
              id="registerName"
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Nguyễn Văn A"
              type="text"
              value={form.name}
            />
          </div>
          <div className="auth-form-row">
            <label htmlFor="registerEmail">Email</label>
            <input
              autoComplete="email"
              id="registerEmail"
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="ban@email.com"
              type="email"
              value={form.email}
            />
          </div>
          <div className="auth-form-row">
            <label htmlFor="registerPhone">Số điện thoại</label>
            <input
              autoComplete="tel"
              id="registerPhone"
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="09xxxxxxxx"
              type="tel"
              value={form.phone}
            />
          </div>
          <div className="auth-form-row">
            <label htmlFor="registerPassword">Mật khẩu</label>
            <input
              autoComplete="new-password"
              id="registerPassword"
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              value={form.password}
            />
          </div>
          <div className={`auth-form-row ${invalidConfirm ? 'invalid' : ''}`}>
            <label htmlFor="registerConfirm">Nhập lại mật khẩu</label>
            <input
              autoComplete="new-password"
              id="registerConfirm"
              onChange={(event) => updateField('confirm', event.target.value)}
              placeholder="Nhập lại mật khẩu"
              type="password"
              value={form.confirm}
            />
          </div>
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
        <Link className="auth-guest-link" to="/shop">Tiếp tục mua sắm không cần tài khoản →</Link>
      </div>
    </div>
  );
}
