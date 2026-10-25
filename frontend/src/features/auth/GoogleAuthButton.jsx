import { useEffect, useRef, useState } from 'react';
import { getGoogleClientId, initGoogleIdentityServices, loadGoogleIdentityScript } from './googleOAuth.js';
import { loginWithGoogle } from './authService.js';

export default function GoogleAuthButton({ mode = 'login', onSuccess, onError, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const buttonRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError });
  const busyRef = useRef(false);
  const disabledRef = useRef(disabled);
  callbacksRef.current = { onSuccess, onError };
  disabledRef.current = disabled;

  useEffect(() => {
    let active = true;
    const container = buttonRef.current;
    setError('');

    async function setup() {
      const clientId = getGoogleClientId();
      if (!clientId) {
        setError('Đăng nhập Google chưa được cấu hình. Vui lòng đăng nhập bằng email và mật khẩu.');
        return;
      }
      if (!await loadGoogleIdentityScript()) {
        if (active) setError('Không tải được Google. Hãy kiểm tra kết nối hoặc trình chặn nội dung rồi thử lại.');
        return;
      }
      if (!active) return;
      container.replaceChildren();
      const initialized = initGoogleIdentityServices({
        clientId,
        buttonElement: container,
        buttonText: mode === 'register' ? 'signup_with' : 'signin_with',
        onCredential: async (credential) => {
          if (!active || disabledRef.current || busyRef.current) return;
          busyRef.current = true;
          setLoading(true);
          setError('');
          try {
            const result = await loginWithGoogle(credential);
            if (!active) return;
            if (result.ok) callbacksRef.current.onSuccess?.(result);
            else {
              setError(result.error);
              callbacksRef.current.onError?.(result.error);
            }
          } catch {
            if (active) setError('Không thể đăng nhập Google. Vui lòng thử lại.');
          } finally {
            busyRef.current = false;
            if (active) setLoading(false);
          }
        },
      });
      if (!initialized) setError('Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.');
    }
    setup();
    return () => {
      active = false;
      container?.replaceChildren();
    };
  }, [mode, retry]);

  return (
    <div className="google-auth-wrapper" aria-busy={loading}>
      <div
        ref={buttonRef}
        inert={disabled || loading ? true : undefined}
        style={{ minHeight: 44, pointerEvents: disabled || loading ? 'none' : undefined, opacity: disabled || loading ? 0.6 : 1 }}
      />
      {loading ? <p role="status">Đang đăng nhập Google...</p> : null}
      {error ? (
        <div className="auth-form-msg error" role="alert">
          {error}
          {getGoogleClientId() ? <button type="button" onClick={() => setRetry((value) => value + 1)} disabled={disabled || loading}>Thử lại</button> : null}
        </div>
      ) : null}
    </div>
  );
}
