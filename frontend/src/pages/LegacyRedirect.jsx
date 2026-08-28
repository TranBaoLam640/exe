import { Navigate, useLocation } from 'react-router-dom';

export default function LegacyRedirect({ to }) {
  const location = useLocation();
  return <Navigate replace to={`${to}${location.search}${location.hash}`} />;
}
