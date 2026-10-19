import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import AnalyticsTracker from '../analytics/AnalyticsTracker.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AnalyticsTracker />
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
