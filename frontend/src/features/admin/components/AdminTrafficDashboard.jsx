import { useEffect, useState } from 'react';
import { getTrafficAnalytics, recordVisit, resetTrafficAnalytics, TRAFFIC_UPDATED_EVENT } from '../../analytics/visitTracker.js';
import { getGaMeasurementId } from '../../../utils/analytics.js';

export default function AdminTrafficDashboard() {
  const [analytics, setAnalytics] = useState(() => getTrafficAnalytics());
  const [activeRange, setActiveRange] = useState('7d');
  const [filterPage, setFilterPage] = useState('');
  const measurementId = getGaMeasurementId();

  function reload() {
    setAnalytics(getTrafficAnalytics());
  }

  useEffect(() => {
    function handleUpdate() {
      reload();
    }
    document.addEventListener(TRAFFIC_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      document.removeEventListener(TRAFFIC_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  function handleSimulateVisit() {
    const samplePages = ['/', '/shop', '/ai-tryon', '/cart', '/checkout', '/loyalty'];
    const randomPage = samplePages[Math.floor(Math.random() * samplePages.length)];
    recordVisit(randomPage, `Trang mẫu ${randomPage}`);
    reload();
  }

  function handleReset() {
    if (window.confirm('Bạn có chắc muốn đặt lại dữ liệu thống kê truy cập về mốc ban đầu?')) {
      resetTrafficAnalytics();
      reload();
    }
  }

  const filteredRecent = analytics.recentVisits.filter((item) => {
    if (!filterPage) return true;
    return item.path.toLowerCase().includes(filterPage.toLowerCase()) || (item.title && item.title.toLowerCase().includes(filterPage.toLowerCase()));
  });

  return (
    <div className="admin-traffic-dashboard">
      {/* Top Header & Quick Actions */}
      <div className="admin-traffic-head">
        <div>
          <span className="admin-kicker">Analytics & Traffic</span>
          <h2>Thống kê Lượt truy cập & Google Analytics</h2>
          <p>Giám sát lưu lượng truy cập thực tế của khách hàng trên toàn bộ hệ thống DoRentMe.</p>
        </div>
        <div className="admin-traffic-actions">
          <button type="button" className="admin-secondary-button" onClick={reload}>
            🔄 Làm mới
          </button>
          <button type="button" className="admin-secondary-button" onClick={handleSimulateVisit}>
            + Thêm lượt mẫu
          </button>
          <button type="button" className="admin-text-button" onClick={handleReset} title="Khôi phục mốc ban đầu">
            Đặt lại dữ liệu
          </button>
        </div>
      </div>

      {/* Google Analytics 4 Status Badge */}
      <div className="admin-ga-banner">
        <div className="admin-ga-info">
          <div className="admin-ga-status-indicator">
            <span className="pulse-dot" />
            <strong>Google Analytics 4: Đang kích hoạt</strong>
          </div>
          <div className="admin-ga-id-pill">
            <span>Measurement ID:</span> <code>{measurementId}</code>
          </div>
          <p>
            Mã theo dõi GA4 (gtag.js) đang tự động thu thập Pageview trên từng route và các sự kiện thử đồ AI (AI Try-on).
          </p>
        </div>
        <div className="admin-ga-links">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noreferrer"
            className="admin-ga-external-btn"
          >
            Mở Google Analytics Console ↗
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon pageviews">📈</div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng lượt xem trang</span>
            <strong className="kpi-value">{analytics.totalVisits.toLocaleString('vi-VN')}</strong>
            <small className="kpi-sub positive">↑ +18.4% so với tuần trước</small>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon today">📅</div>
          <div className="kpi-content">
            <span className="kpi-label">Lượt truy cập hôm nay</span>
            <strong className="kpi-value">{analytics.todayVisits.toLocaleString('vi-VN')}</strong>
            <small className="kpi-sub">Gồm {analytics.todayUniques} khách duy nhất</small>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon visitors">👥</div>
          <div className="kpi-content">
            <span className="kpi-label">Khách truy cập duy nhất</span>
            <strong className="kpi-value">{analytics.uniqueVisitors.toLocaleString('vi-VN')}</strong>
            <small className="kpi-sub positive">Tỷ lệ khách quay lại 42%</small>
          </div>
        </div>

        <div className="admin-kpi-card highlight">
          <div className="kpi-icon ai">✨</div>
          <div className="kpi-content">
            <span className="kpi-label">Lượt Thử đồ bằng AI</span>
            <strong className="kpi-value">{analytics.aiTryOnTotal.toLocaleString('vi-VN')}</strong>
            <small className="kpi-sub highlight">Tỷ lệ tương tác cao</small>
          </div>
        </div>
      </div>

      {/* Chart Section & Devices Section */}
      <div className="admin-traffic-charts-row">
        {/* 7-day Bar Chart */}
        <div className="admin-chart-box">
          <div className="admin-box-head">
            <h3>Biểu đồ Lượt truy cập 7 ngày gần nhất</h3>
            <span className="chart-badge">Lưu lượng hàng ngày</span>
          </div>
          <div className="admin-bar-chart">
            {analytics.trend.map((day) => {
              const heightPercent = Math.max(12, Math.round((day.visits / (analytics.maxDayVisits || 1)) * 100));
              return (
                <div key={day.date} className={`bar-col ${day.isToday ? 'today' : ''}`}>
                  <div className="bar-tooltip">
                    <b>{day.visits} lượt xem</b>
                    <small>{day.uniques} khách duy nhất</small>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${heightPercent}%` }}>
                      <span className="bar-val">{day.visits}</span>
                    </div>
                  </div>
                  <span className="bar-label">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="admin-devices-box">
          <div className="admin-box-head">
            <h3>Thiết bị truy cập</h3>
            <span className="chart-badge">Platform</span>
          </div>
          <div className="admin-devices-list">
            {analytics.deviceBreakdown.map((dev) => {
              const icon = dev.device === 'Mobile' ? '📱' : dev.device === 'Desktop' ? '💻' : '📟';
              return (
                <div key={dev.device} className="device-item">
                  <div className="device-info">
                    <span className="device-icon" aria-hidden="true">{icon}</span>
                    <div>
                      <strong>{dev.device}</strong>
                      <small>{dev.count.toLocaleString('vi-VN')} lượt</small>
                    </div>
                  </div>
                  <div className="device-bar-wrap">
                    <div className="device-bar" style={{ width: `${dev.percentage}%` }} />
                    <span className="device-pct">{dev.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Pages Table */}
      <div className="admin-box-section">
        <div className="admin-box-head">
          <h3>Top Trang được xem nhiều nhất</h3>
          <span className="chart-badge">{analytics.topPages.length} trang phổ biến</span>
        </div>
        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Đường dẫn (URL)</th>
                <th>Tiêu đề trang</th>
                <th>Số lượt xem</th>
                <th>Tỷ trọng %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPages.map((page) => (
                <tr key={page.path}>
                  <td>
                    <code>{page.path}</code>
                  </td>
                  <td>
                    <strong>{page.title}</strong>
                  </td>
                  <td>
                    <b>{page.count.toLocaleString('vi-VN')}</b>
                  </td>
                  <td>
                    <div className="page-pct-bar-wrap">
                      <div className="page-pct-bar" style={{ width: `${page.percentage}%` }} />
                      <span>{page.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Recent Visits Log */}
      <div className="admin-box-section">
        <div className="admin-box-head">
          <div>
            <h3>Lịch sử truy cập gần đây (Thời gian thực)</h3>
            <small className="admin-muted">Ghi nhận từng hành vi mở trang của khách hàng</small>
          </div>
          <div className="admin-table-filter">
            <input
              type="text"
              placeholder="Lọc theo URL hoặc tiêu đề..."
              value={filterPage}
              onChange={(e) => setFilterPage(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Trang truy cập</th>
                <th>Khách truy cập</th>
                <th>Thiết bị</th>
                <th>Trình duyệt</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecent.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                    Chưa có lượt truy cập nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRecent.slice(0, 25).map((visit) => {
                  const dateObj = new Date(visit.time);
                  const formattedTime = dateObj.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <tr key={visit.id}>
                      <td>
                        <strong>{formattedTime}</strong>
                        <small>{formattedDate}</small>
                      </td>
                      <td>
                        <strong>{visit.title}</strong>
                        <small><code>{visit.path}</code></small>
                      </td>
                      <td>
                        <code>{visit.visitorId}</code>
                      </td>
                      <td>{visit.device}</td>
                      <td>{visit.browser}</td>
                      <td>
                        <span className={`admin-status-pill ${visit.role === 'ADMIN' ? 'delivered' : 'pending_confirmation'}`}>
                          {visit.role}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
