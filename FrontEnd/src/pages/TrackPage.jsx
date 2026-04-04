import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { trackProductApi, getImageUrl } from '../services/api';
import './TrackPage.css';

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const buildDescriptionFallback = (p) => {
    if (!p) return 'Thông tin mô tả sản phẩm đang được cập nhật.';
    const quantityText = p.quantity && p.unit ? `${p.quantity} ${p.unit}` : 'không xác định số lượng';
    const priceText = Number.isFinite(Number(p.price)) ? `${Number(p.price).toLocaleString('vi-VN')}đ/${p.unit || 'đơn vị'}` : 'đang cập nhật giá';
    return `${p.name || 'Sản phẩm nông sản'} do ${p.farmerId || 'nhà sản xuất đã đăng ký'} cung cấp, quy cách ${quantityText}, giá ${priceText}.`;
  };

  useEffect(() => {
    async function loadData() {
      if (!batchId) {
        setError('Không có mã lô hàng trong đường dẫn!');
        setLoading(false);
        return;
      }

      try {
        const result = await trackProductApi(batchId);
        if (result.ok) {
          const payload = result.data?.data;
          if (payload?.product) {
            setProduct(payload.product);
            setDiaries(payload.diaries || []);
          } else {
            setProduct(payload);
            setDiaries([]);
          }
        } else {
          setError('Không tìm thấy thông tin lô hàng này trong hệ thống!');
        }
      } catch {
        setError('Lỗi kết nối server! Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [batchId]);

  if (loading) {
    return (
      <div className="status-loading">
        <p>Đang truy xuất thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-error">
        <h3>Hệ thống thông báo</h3>
        <p>{error}</p>
        <Link to="/search" className="btn-back-link">Quay lại trang tra cứu</Link>
      </div>
    );
  }

  return (
    <div className="track-page fade-in">
      <button className="back-btn-top" onClick={() => navigate('/search')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      {product && (
        <>
          <div className="track-cover">
            <img src={getImageUrl(product.productImageUrl)} alt={product.name} />
            <div className="verify-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Đã xác thực
            </div>
          </div>

          <div className="track-main-container">
            <div className="track-title-section">
              <h1 className="track-title">{product.name}</h1>
              <div className="track-meta-row">
                <div className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  Xuất xứ: {product.origin || 'Đang cập nhật'}
                </div>
                <div className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Thu hoạch: {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="track-tabs">
              <button className={`track-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Tổng quan</button>
              <button className={`track-tab-btn ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}>Nhật ký</button>
            </div>

            {activeTab === 'overview' && (
              <div className="tab-content-container fade-in">
                <div className="info-card producer">
                  <div className="card-icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-label">Thông tin người sản xuất</div>
                    <div className="card-value">{product.farmerId || 'Đang cập nhật'}</div>
                    <div className="card-subtext">Nhà sản xuất đã đăng ký trong hệ thống</div>
                  </div>
                </div>

                <div className="info-card authority">
                  <div className="card-icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-label">Thông tin phê duyệt hệ thống</div>
                    <div className="card-value">Quản trị hệ thống nông sản</div>
                    <div className="card-subtext">
                      Trạng thái: {
                        product.status === 'APPROVED'
                          ? 'Đã được Admin phê duyệt'
                          : product.status === 'PENDING'
                            ? 'Đang chờ Admin phê duyệt'
                            : 'Đã bị Admin từ chối'
                      }
                    </div>
                  </div>
                </div>

                <div className="info-card description">
                  <div className="card-icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div className="card-content">
                    <div className="card-label">Mô tả sản phẩm</div>
                    <div className="description-text">
                      {product.description?.trim() || buildDescriptionFallback(product)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'diary' && (
              <div className="tab-content-container fade-in">
                {diaries.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    <p>Chưa có nhật ký chăm sóc nào cho sản phẩm này.</p>
                  </div>
                ) : (
                  <div className="track-diary-list">
                    {diaries.map((entry, index) => (
                      <article className="track-diary-item" key={`${entry._id || index}`}>
                        <div className="track-diary-header">
                          <h4>{entry.activityTitle}</h4>
                          <span>
                            {entry.actionDate
                              ? new Date(entry.actionDate).toLocaleDateString('vi-VN')
                              : 'Không có ngày'}
                          </span>
                        </div>
                        <p>{entry.description}</p>
                        <div className="track-diary-meta">
                          Ghi nhận: {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString('vi-VN') : 'Đang cập nhật'}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bottom-actions-bar">
            <button className="btn-bottom outline" onClick={() => navigate('/search')}>Tra cứu mới</button>
            <button className="btn-bottom solid" onClick={() => navigate('/')}>Hoàn tất</button>
          </div>
        </>
      )}
    </div>
  );
}
