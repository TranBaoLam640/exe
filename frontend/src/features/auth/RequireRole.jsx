import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from './useAuthState.js';

export default function RequireRole({ allowedRoles, children }) {
  const session = useAuthState();
  const location = useLocation();
  const roles = allowedRoles.map((role) => role.toUpperCase());
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);

  if (!session?.token) {
    return <Navigate replace to={`/login?redirect=${redirect}`} />;
  }

  if (!roles.includes((session.role || '').toUpperCase())) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <div className="admin-brand">
            <h1>DoRentMe Admin</h1>
          </div>
          <span>Access denied</span>
        </header>
        <main className="admin-body">
          <div className="admin-empty">Your account does not have permission to access this page.</div>
        </main>
      </div>
    );
  }

  return children;
}
