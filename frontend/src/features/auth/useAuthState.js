import { useEffect, useState } from 'react';
import { AUTH_CHANGED_EVENT, getSession, SESSION_KEY } from './authService.js';

export function useAuthState() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const update = () => setSession(getSession());
    const onStorage = (event) => {
      if (event.key === SESSION_KEY) update();
    };

    document.addEventListener(AUTH_CHANGED_EVENT, update);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener(AUTH_CHANGED_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return session;
}
