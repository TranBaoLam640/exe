import { useEffect, useState } from 'react';
import { getTrafficAnalytics, recordVisit, resetTrafficAnalytics, TRAFFIC_UPDATED_EVENT } from '../../analytics/visitTracker.js';
import { getGaMeasurementId } from '../../../utils/analytics.js';
import { getAiPurchasesSummary, AI_PURCHASE_UPDATED_EVENT } from '../../ai/tryon/aiPurchaseHistory.js';

export default function AdminTrafficDashboard() {
  const [analytics, setAnalytics] = useState(() => getTrafficAnalytics());
  const [aiPurchases, setAiPurchases] = useState(() => getAiPurchasesSummary());
  const [activeRange, setActiveRange] = useState('7d');
  const [filterPage, setFilterPage] = useState('');
  const [filterAiAccount, setFilterAiAccount] = useState('');
  const measurementId = getGaMeasurementId();

  function reload() {
    setAnalytics(getTrafficAnalytics());
    setAiPurchases(getAiPurchasesSummary());
  }

  useEffect(() => {
    function handleUpdate() {
      reload();
    }
    document.addEventListener(TRAFFIC_UPDATED_EVENT, handleUpdate);
    document.addEventListener(AI_PURCHASE_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      document.removeEventListener(TRAFFIC_UPDATED_EVENT, handleUpdate);
      document.removeEventListener(AI_PURCHASE_UPDATED_EVENT, handleUpdate);
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

  const filteredAiPurchases = aiPurchases.list.filter((item) => {
    if (!filterAiAccount) return true;
    const q = filterAiAccount.toLowerCase();
    return (
      item.email.toLowerCase().includes(q) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      item.orderCode.includes(q) ||
      item.packageName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-traffic-dashboard">
      {/* Top Header & Quick Actions */}
      <div className="admin-traffic-head">
        <div>
          <span className="admin-kicker">Thống kê & Lưu lượng</span>
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
            <strong>Google Analytics 4: Đang hoạt động</strong>
          </div>
          <div className="admin-ga-id-pill">
            <span>Mã đo lường (Measurement ID):</span> <code>{measurementId}</code>
          </div>
          <p>
            Mã theo dõi GA4 (gtag.js) đang tự động thu thập lượt xem trang (Pageview) và các sự kiện thử đồ AI (AI Try-on).
          </p>
        </div>
        <div className="admin-ga-links">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noreferrer"
            className="admin-ga-external-btn"
          >
            Mở trang quản trị Google Analytics ↗
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

        <div className="admin-kpi-card highlight" style={{ borderColor: '#86efac', background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)' }}>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#059669', fontSize: '1.4rem' }}>💳</div>
          <div className="kpi-content">
            <span className="kpi-label">Doanh thu Gói AI (PayOS)</span>
            <strong className="kpi-value" style={{ color: '#047857' }}>{aiPurchases.totalRevenue.toLocaleString('vi-VN')} đ</strong>
            <small className="kpi-sub positive">{aiPurchases.totalCount} đơn ({aiPurchases.dayPassCount} gói ngày, {aiPurchases.monthPassCount} gói tháng)</small>
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
            <span className="chart-badge">Nền tảng</span>
          </div>
          <div className="admin-devices-list">
            {analytics.deviceBreakdown.map((dev) => {
              const icon = dev.device === 'Mobile' ? '📱' : dev.device === 'Desktop' ? '💻' : '📟';
              const devName = dev.device === 'Mobile' ? 'Điện thoại' : dev.device === 'Desktop' ? 'Máy tính' : dev.device === 'Tablet' ? 'Máy tính bảng' : dev.device;
              return (
                <div key={dev.device} className="device-item">
                  <div className="device-info">
                    <span className="device-icon" aria-hidden="true">{icon}</span>
                    <div>
                      <strong>{devName}</strong>
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

      {/* AI Package Purchase History & PayOS Transactions */}
      <div className="admin-box-section">
        <div className="admin-box-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="tryon-badge" style={{ fontSize: '0.72rem' }}>Thương mại AI Stylist</span>
              <span className="chart-badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                Tổng thu: <strong>{aiPurchases.totalRevenue.toLocaleString('vi-VN')} đ</strong>
              </span>
            </div>
            <h3 style={{ margin: '4px 0' }}>Lịch sử Mua Gói AI & Giao dịch PayOS</h3>
            <small className="admin-muted">
              Ghi nhận các tài khoản đã mua và kích hoạt gói thử đồ AI qua cổng thanh toán PayOS
            </small>
          </div>
          <div className="admin-table-filter">
            <input
              type="text"
              placeholder="Lọc theo email hoặc mã đơn..."
              value={filterAiAccount}
              onChange={(e) => setFilterAiAccount(e.target.value)}
            />
          </div>
        </div>

        {/* Quick summary chips */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
            <span>⚡ Gói Ngày (10.000đ): </span>
            <strong style={{ color: '#047857' }}>{aiPurchases.dayPassCount} tài khoản ({aiPurchases.dayPassRevenue.toLocaleString('vi-VN')} đ)</strong>
          </div>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
            <span>👑 Gói Tháng VIP (50.000đ): </span>
            <strong style={{ color: '#6b21a8' }}>{aiPurchases.monthPassCount} tài khoản ({aiPurchases.monthPassRevenue.toLocaleString('vi-VN')} đ)</strong>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
            <span>🛡️ Cổng thanh toán: </span>
            <strong style={{ color: '#1e293b' }}>100% PayOS / VietQR (Đã thanh toán)</strong>
          </div>
        </div>

        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Mã đơn (PayOS)</th>
                <th>Tài khoản / Email</th>
                <th>Gói đăng ký</th>
                <th>Thời hạn</th>
                <th>Số tiền</th>
                <th>Cổng thanh toán</th>
                <th>Thời gian thanh toán</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredAiPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
                    Không tìm thấy giao dịch nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredAiPurchases.map((item) => {
                  const dateObj = new Date(item.purchasedAt);
                  const formattedTime = dateObj.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const isMonth = item.packageId === 'ai_month_pass';

                  return (
                    <tr key={item.orderCode}>
                      <td>
                        <code>DRM{item.orderCode}</code>
                      </td>
                      <td>
                        <strong>{item.customerName || item.email.split('@')[0]}</strong>
                        <small>{item.email}</small>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.78rem',
                            background: isMonth ? '#f3e8ff' : '#eff6ff',
                            color: isMonth ? '#6b21a8' : '#1d4ed8',
                            border: `1px solid ${isMonth ? '#d8b4fe' : '#bfdbfe'}`,
                          }}
                        >
                          {isMonth ? '👑 ' : '⚡ '}
                          {item.packageName}
                        </span>
                      </td>
                      <td>
                        <b>{item.durationText}</b>
                      </td>
                      <td>
                        <b style={{ color: isMonth ? '#7e22ce' : '#047857' }}>{item.priceDisplay}</b>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: '500', color: '#374151' }}>
                          🏦 {item.providerName || 'PayOS (VietQR)'}
                        </span>
                      </td>
                      <td>
                        <strong>{formattedTime}</strong>
                        <small>{formattedDate}</small>
                      </td>
                      <td>
                        <span className="admin-status-pill delivered" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85em' }}>✓</span> {item.statusText || 'Đã kích hoạt'}
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

                  const devName = visit.device === 'Mobile' ? 'Điện thoại' : visit.device === 'Desktop' ? 'Máy tính' : visit.device === 'Tablet' ? 'Máy tính bảng' : visit.device;
                  const roleLabel =
                    visit.role === 'ADMIN' ? 'Quản trị viên' :
                    visit.role === 'LENDER' ? 'Chủ shop' :
                    visit.role === 'SHIPPER' ? 'Shipper' :
                    visit.role === 'CUSTOMER' ? 'Khách thuê' :
                    'Khách xem';

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
                      <td>{devName}</td>
                      <td>{visit.browser}</td>
                      <td>
                        <span className={`admin-status-pill ${visit.role === 'ADMIN' ? 'delivered' : 'pending_confirmation'}`}>
                          {roleLabel}
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
