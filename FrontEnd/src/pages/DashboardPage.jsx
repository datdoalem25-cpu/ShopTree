import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useDiary } from '../hooks/useDiary';
import { useSettings } from '../hooks/useSettings';
import ProductCard from '../components/ProductCard';
import StatCard from '../components/StatCard';
import DiaryCard from '../components/DiaryCard';
import Modal from '../components/Modal';
import { getImageUrl } from '../services/api';
import { showAlert, showConfirm } from '../services/dialog';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth('FARMER');
  const { products, stats, createProduct, updateProduct, deleteProduct } = useProducts(user);
  const { diaries, loading: diaryLoading, loadDiaries, addDiary } = useDiary(user);
  const { updateFullName, updateEmailInline, changeEmail, changePassword, deleteAccount } = useSettings();

  const [activeTab, setActiveTab] = useState('tab-overview');
  const [modalType, setModalType] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [qrToPrint, setQrToPrint] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [savingField, setSavingField] = useState('');
  const [diaryError, setDiaryError] = useState('');
  const [diaryPopup, setDiaryPopup] = useState({ isOpen: false, message: '', tone: 'error' });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [qrDownloading, setQrDownloading] = useState(false);

  const productFormRef = useRef(null);
  const diaryFormRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (user && activeTab === 'tab-logs') {
      loadDiaries();
    }
  }, [user, activeTab, loadDiaries]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.fullName || '');
    setProfileEmail(user.email || '');
    setDraftName(user.fullName || '');
    setDraftEmail(user.email || '');
  }, [user]);

  useEffect(() => {
    const statusEvents = products
      .filter((p) => p.status === 'APPROVED' || p.status === 'REJECTED')
      .map((p) => ({
        id: p._id,
        status: p.status,
        name: p.name,
        createdAt: p.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setNotificationItems(statusEvents);

    if (!user?.id) {
      setUnreadNotificationCount(0);
      return;
    }

    const seenKey = `seen-product-status:${user.id}`;
    const seenList = JSON.parse(localStorage.getItem(seenKey) || '[]');
    const unseenCount = statusEvents.filter((item) => !seenList.includes(`${item.id}:${item.status}`)).length;
    setUnreadNotificationCount(unseenCount);
  }, [products, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const formatNotificationTime = (value) => {
    if (!value) return 'Vừa xong';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Vừa xong';
    return date.toLocaleString('vi-VN');
  };

  const toggleNotificationPanel = () => {
    const nextState = !notificationOpen;
    setNotificationOpen(nextState);

    if (!nextState || !user?.id) return;

    const seenKey = `seen-product-status:${user.id}`;
    const signatures = notificationItems.map((item) => `${item.id}:${item.status}`);
    localStorage.setItem(seenKey, JSON.stringify(signatures));
    setUnreadNotificationCount(0);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editingProduct) {
      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        quantity: formData.get('quantity'),
        unit: formData.get('unit'),
        price: formData.get('price'),
      };
      const success = await updateProduct(editingProduct._id, data);
      if (success) {
        setModalType(null);
        setEditingProduct(null);
      }
    } else {
      const success = await createProduct(formData);
      if (success) {
        setModalType(null);
        productFormRef.current?.reset();
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalType('product');
  };

  const handlePrintQR = (product) => {
    setQrToPrint(product);
    setModalType('qr');
  };

  const eligibleDiaryProducts = products.filter(
    (p) => p.status === 'APPROVED' || p.status === 'PENDING'
  );

  const openDiaryModal = () => {
    if (eligibleDiaryProducts.length === 0) {
      setDiaryError('Bạn chưa có sản phẩm đã/đang duyệt để thêm nhật ký. Vui lòng tạo sản phẩm trước.');
      return;
    }

    setDiaryError('');
    setModalType('diary');
  };

  const openDiaryPopup = (message, tone = 'error') => {
    setDiaryPopup({ isOpen: true, message, tone });
  };

  const handleDownloadQrImage = async () => {
    if (!qrToPrint?.qrCodeImageUrl || qrDownloading) return;

    setQrDownloading(true);
    try {
      const response = await fetch(getImageUrl(qrToPrint.qrCodeImageUrl));
      if (!response.ok) throw new Error('DOWNLOAD_FAILED');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${qrToPrint.batchSerialNumber || qrToPrint._id || 'SANPHAM'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      await showAlert('Không tải được ảnh QR. Vui lòng thử lại.', { tone: 'danger' });
    } finally {
      setQrDownloading(false);
    }
  };

  const handleDiarySubmit = async (e) => {
    e.preventDefault();
    if (eligibleDiaryProducts.length === 0) {
      setDiaryError('Bạn chưa có sản phẩm đã/đang duyệt để thêm nhật ký. Vui lòng tạo sản phẩm trước.');
      setModalType(null);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const productId = String(formData.get('productId') || '').trim();
    const activityTitle = String(formData.get('activityTitle') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const rawActionDate = String(formData.get('actionDate') || '').trim();
    const selectedProduct = eligibleDiaryProducts.find((p) => p._id === productId);

    const normalizeActionDate = (dateText) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
      const parsed = new Date(dateText);
      if (Number.isNaN(parsed.getTime())) return '';
      return parsed.toISOString().slice(0, 10);
    };

    const actionDate = normalizeActionDate(rawActionDate);

    if (!productId || !activityTitle || !description || !actionDate) {
      openDiaryPopup('Vui lòng điền đầy đủ thông tin nhật ký và chọn ngày hợp lệ.');
      return;
    }

    if (!selectedProduct) {
      openDiaryPopup('Sản phẩm đã chọn không hợp lệ. Vui lòng chọn lại sản phẩm.');
      return;
    }

    const data = {
      productId,
      cropLabel: selectedProduct.name, // Tương thích backend cũ còn yêu cầu cropLabel
      activityTitle,
      description,
      actionDate,
    };
    const result = await addDiary(data);
    if (result.ok) {
      setModalType(null);
      diaryFormRef.current?.reset();
      openDiaryPopup(result.message, 'success');
      return;
    }

    openDiaryPopup(result.message || 'Không thể lưu nhật ký. Vui lòng thử lại.');
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  const syncLocalUser = (changes) => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    localStorage.setItem('user', JSON.stringify({ ...parsed, ...changes }));
  };

  const handleSaveName = async () => {
    if (!user?.id) return;
    setSavingField('name');
    const result = await updateFullName(user.id, draftName);
    setSavingField('');
    if (!result.ok) {
      await showAlert(result.message, { tone: 'danger' });
      return;
    }

    const nextName = result.data?.fullName || draftName.trim();
    setProfileName(nextName);
    setDraftName(nextName);
    syncLocalUser({ fullName: nextName });
    setEditingName(false);
  };

  const handleSaveEmail = async () => {
    if (!user?.id) return;
    setSavingField('email');
    const result = await updateEmailInline(user.id, draftEmail);
    setSavingField('');
    if (!result.ok) {
      await showAlert(result.message, { tone: 'danger' });
      return;
    }

    const nextEmail = result.data?.email || draftEmail.trim();
    setProfileEmail(nextEmail);
    setDraftEmail(nextEmail);
    syncLocalUser({ email: nextEmail });
    setEditingEmail(false);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Bạn có chắc chắn muốn đăng xuất không?', {
      title: 'Xác nhận đăng xuất',
      tone: 'warning',
      confirmText: 'Đăng xuất',
      cancelText: 'Ở lại',
    });

    if (!confirmed) return;
    logout();
  };

  return (
    <div className="dashboard-layout">
      {/* TOPBAR */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
          <span className="brand-name">ShopTree</span>
        </div>
        <div className="topbar-right">
          <div className="notification-wrap" ref={notificationRef}>
            <button className="btn-icon" onClick={toggleNotificationPanel} aria-label="Thông báo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="notification-dot">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
              )}
            </button>

            {notificationOpen && (
              <div className="notification-panel">
                <div className="notification-header">Thông báo hệ thống</div>
                {notificationItems.length === 0 ? (
                  <div className="notification-empty">Chưa có thông báo về duyệt sản phẩm.</div>
                ) : (
                  <div className="notification-list">
                    {notificationItems.slice(0, 8).map((item) => (
                      <div className="notification-item" key={`${item.id}:${item.status}`}>
                        <div className={`notification-status ${item.status === 'APPROVED' ? 'ok' : 'fail'}`}>
                          {item.status === 'APPROVED' ? '✓' : '!'}
                        </div>
                        <div className="notification-text">
                          <p>
                            Sản phẩm <strong>{item.name}</strong>{' '}
                            {item.status === 'APPROVED' ? 'đã được duyệt.' : 'đã bị từ chối.'}
                          </p>
                          <span>{formatNotificationTime(item.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="topbar-avatar">{getInitials(user.fullName)}</div>
          <button className="btn-logout" onClick={handleLogout}>
            [Đăng xuất]
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'tab-overview' ? 'active' : ''}`} onClick={() => setActiveTab('tab-overview')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Tổng quan
            </button>
            <button className={`nav-item ${activeTab === 'tab-products' ? 'active' : ''}`} onClick={() => setActiveTab('tab-products')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              Sản phẩm của tôi
            </button>
            <button className={`nav-item ${activeTab === 'tab-logs' ? 'active' : ''}`} onClick={() => setActiveTab('tab-logs')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Nhật ký mùa vụ
            </button>
            <button className={`nav-item ${activeTab === 'tab-settings' ? 'active' : ''}`} onClick={() => setActiveTab('tab-settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Cài đặt
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-avatar">{getInitials(user.fullName)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.fullName}</div>
              <div className="sidebar-user-role">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Nông dân'}</div>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="dashboard-main">
          {activeTab === 'tab-overview' && (
            <div className="tab-pane fade-in">
              <h2 className="tab-title">Tổng quan</h2>
              
              <div className="stats-row">
                <StatCard
                  title="Tổng sản phẩm"
                  value={stats.total}
                  icon="📦"
                  statType="total"
                  onLinkClick={() => setActiveTab('tab-products')}
                />
                <StatCard title="Đang chờ duyệt" value={stats.pending} icon="⏳" statType="pending" />
                <StatCard title="Đã phê duyệt" value={stats.approved} icon="✅" statType="approved" />
                <StatCard title="Bị từ chối" value={stats.rejected} icon="❌" statType="rejected" />
              </div>
              
              <div className="activity-panel">
                <h3>Hoạt động gần đây</h3>
                <div className="activity-timeline">
                  {/* Mock activities for purely aesthetic purposes since backend does not supply timeline yet */}
                  <div className="timeline-item">
                    <div className="timeline-icon bg-success-light text-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <div className="timeline-content">
                      <p>Sản phẩm 'Cà chua Đà Lạt' đã được phê duyệt</p>
                      <span>5 phút trước</span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon bg-primary-light text-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
                    <div className="timeline-content">
                      <p>Bạn đã thêm sản phẩm 'Bơ sáp Đắk Lắk'</p>
                      <span>1 giờ trước</span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon bg-warning-light text-warning"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                    <div className="timeline-content">
                      <p>Sản phẩm 'Xà lách thủy canh' đang chờ duyệt</p>
                      <span>3 giờ trước</span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon bg-muted-light text-muted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
                    <div className="timeline-content">
                      <p>Bạn đã cập nhật nhật ký mùa vụ tháng 3</p>
                      <span>1 ngày trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tab-products' && (
            <div className="tab-pane fade-in">
              <div className="tab-header">
                <h2 className="tab-title">Sản phẩm của tôi</h2>
                <button className="btn-solid" onClick={() => { setEditingProduct(null); setModalType('product'); }}>+ Thêm sản phẩm</button>
              </div>
              <div className="product-grid">
                {products.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: 'span 2' }}>
                     <p>Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</p>
                  </div>
                ) : (
                  products.map(p => (
                    <ProductCard 
                      key={p._id} 
                      product={p} 
                      onEdit={openEditModal}
                      onDelete={deleteProduct}
                      onPrintQR={handlePrintQR}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'tab-logs' && (
             <div className="tab-pane fade-in">
              <div className="tab-header">
                <div>
                  <h2 className="tab-title mb-0">Nhật ký mùa vụ</h2>
                  <p className="tab-subtitle">Ghi lại các hoạt động chăm sóc, bón phân và thu hoạch</p>
                </div>
                <button className="btn-solid" onClick={openDiaryModal}>+ Thêm nhật ký</button>
              </div>

              {diaryError && <p className="text-danger" style={{ marginTop: '-10px', marginBottom: '14px' }}>{diaryError}</p>}
              
              <div className="diary-timeline-container">
                {diaryLoading ? (
                  <p className="text-muted">Đang tải nhật ký...</p>
                ) : diaries.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có bản ghi nhật ký nào. Hãy tạo nhật ký mới!</p>
                  </div>
                ) : (
                  <div className="diary-timeline">
                    {diaries.map(d => (
                      <DiaryCard key={d._id} diary={d} />
                    ))}
                  </div>
                )}
              </div>
             </div>
          )}

          {activeTab === 'tab-settings' && (
            <div className="tab-pane fade-in">
              <div className="tab-header" style={{ marginBottom: '30px' }}>
                <div>
                  <h2 className="tab-title mb-0">Cài đặt</h2>
                  <p className="tab-subtitle">Quản lý tài khoản và tùy chỉnh hệ thống</p>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  <h3>Cài đặt tài khoản</h3>
                </div>

                <div className="setting-row">
                  <div className="setting-info setting-info-wide">
                    <h4>Họ và tên</h4>
                    {editingName ? (
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="input-modern setting-inline-input"
                        placeholder="Nhập họ và tên"
                      />
                    ) : (
                      <p className="setting-value">{profileName || 'Chưa cập nhật'}</p>
                    )}
                  </div>
                  <div className="setting-actions">
                    {editingName ? (
                      <>
                        <button className="btn-inline-save" onClick={handleSaveName} disabled={savingField === 'name'}>
                          {savingField === 'name' ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          className="btn-inline-cancel"
                          onClick={() => {
                            setDraftName(profileName);
                            setEditingName(false);
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button className="action-pill" onClick={() => setEditingName(true)}>Chỉnh sửa</button>
                    )}
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-info setting-info-wide">
                    <h4>Email liên hệ</h4>
                    {editingEmail ? (
                      <input
                        type="email"
                        value={draftEmail}
                        onChange={(e) => setDraftEmail(e.target.value)}
                        className="input-modern setting-inline-input"
                        placeholder="Nhập email liên hệ"
                      />
                    ) : (
                      <p className="setting-value">{profileEmail || 'Chưa cập nhật'}</p>
                    )}
                  </div>
                  <div className="setting-actions">
                    {editingEmail ? (
                      <>
                        <button className="btn-inline-save" onClick={handleSaveEmail} disabled={savingField === 'email'}>
                          {savingField === 'email' ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          className="btn-inline-cancel"
                          onClick={() => {
                            setDraftEmail(profileEmail);
                            setEditingEmail(false);
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button className="action-pill" onClick={() => setEditingEmail(true)}>Chỉnh sửa</button>
                    )}
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-info setting-info-wide">
                    <h4>Vai trò</h4>
                    <p className="setting-value">
                      <span className="badge badge-approved" style={{ width: 'fit-content' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Nông dân / Hợp tác xã
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <h3>Bảo mật tài khoản</h3>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Mật khẩu</h4>
                    <p>Cập nhật 3 tháng trước</p>
                  </div>
                  <button className="action-pill" onClick={() => changePassword(user.id)}>Thay đổi</button>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Địa chỉ Email</h4>
                    <p>{profileEmail || 'Chưa cập nhật'}</p>
                  </div>
                  <button className="action-pill" onClick={() => changeEmail(user.id)}>Thay đổi</button>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Xác thực hai yếu tố</h4>
                    <p>Chưa kích hoạt</p>
                  </div>
                  <button className="action-pill">Kích hoạt</button>
                </div>
              </div>

              <div className="setting-card border-danger">
                <div className="setting-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  <h3 className="text-danger">Vùng nguy hiểm</h3>
                </div>
                <p className="text-muted" style={{ marginBottom: '15px' }}>Hành động này sẽ xóa vĩnh viễn tài khoản và mọi dữ liệu của bạn.</p>
                <button className="btn-danger" onClick={() => deleteAccount(user.id)}>Xóa tài khoản</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <Modal isOpen={modalType === 'product'} onClose={() => { setModalType(null); setEditingProduct(null); }}>
        <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Tạo lô hàng mới'}</h3>
        <form onSubmit={handleProductSubmit} ref={productFormRef} className="modal-form">
          <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Tên sản phẩm</label>
          <input type="text" name="name" defaultValue={editingProduct?.name || ''} placeholder="Tên sản phẩm" required className="input-modern" />
          
          <div className="modal-grid-two">
            <div>
              <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Số lượng</label>
              <input type="number" name="quantity" defaultValue={editingProduct?.quantity || ''} placeholder="Số lượng" required className="input-modern" />
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Đơn vị</label>
              <input type="text" name="unit" defaultValue={editingProduct?.unit || ''} placeholder="VD: kg, tấn" required className="input-modern" />
            </div>
          </div>

          <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Giá mỗi đơn vị (VNĐ)</label>
          <input type="number" name="price" defaultValue={editingProduct?.price || ''} placeholder="Giá/Đơn vị" required className="input-modern" />

          <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Mô tả sản phẩm</label>
          <textarea
            name="description"
            defaultValue={editingProduct?.description || ''}
            rows="4"
            placeholder="Mô tả ngắn về quy trình trồng, đặc điểm sản phẩm..."
            required
            className="input-modern"
            style={{ resize: 'vertical' }}
          ></textarea>
          
          {!editingProduct && (
            <>
              <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Ảnh sản phẩm</label>
              <input type="file" name="productImage" accept="image/*" required className="input-modern" />
            </>
          )}

          <button type="submit" className="btn-solid" style={{ width: '100%', marginTop: '20px', padding: '12px', justifyContent: 'center' }}>
            {editingProduct ? 'Cập nhật thay đổi' : 'Gửi phê duyệt'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'diary'} onClose={() => setModalType(null)}>
        <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Thêm nhật ký chăm sóc</h3>
        <form onSubmit={handleDiarySubmit} ref={diaryFormRef} className="modal-form">
          <label className="text-muted" style={{ fontSize: '12px', marginBottom: '5px' }}>Chọn sản phẩm</label>
          <select name="productId" required className="input-modern" defaultValue="">
            <option value="" disabled>Chọn sản phẩm đã/đang duyệt</option>
            {eligibleDiaryProducts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.batchSerialNumber})
              </option>
            ))}
          </select>

          <input type="text" name="activityTitle" placeholder="Tiêu đề (VD: Gieo hạt, Tưới nước)" required className="input-modern" />
          <textarea name="description" rows="4" placeholder="Mô tả công việc..." required className="input-modern" style={{ resize: 'vertical' }}></textarea>
          <input type="date" name="actionDate" required className="input-modern" />
          <button type="submit" className="btn-solid" style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}>Lưu nhật ký</button>
        </form>
      </Modal>

      <Modal
        isOpen={diaryPopup.isOpen}
        onClose={() => setDiaryPopup({ isOpen: false, message: '', tone: 'error' })}
      >
        <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>
          {diaryPopup.tone === 'success' ? 'Thành công' : 'Thông báo'}
        </h3>
        <p
          style={{
            margin: 0,
            color: diaryPopup.tone === 'success' ? '#166534' : '#b91c1c',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {diaryPopup.message}
        </p>
      </Modal>

      <Modal
        isOpen={modalType === 'qr'}
        onClose={() => {
          setQrToPrint(null);
          setModalType(null);
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '10px' }}>Mã QR Truy xuất nguồn gốc</h3>
          {qrToPrint && (
            <>
              <p className="text-muted" style={{ fontSize: '14px', marginBottom: '20px' }}>Sản phẩm: {qrToPrint.name}</p>
              
              <div style={{ padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '15px', display: 'inline-block', marginBottom: '20px' }}>
                {qrToPrint.qrCodeImageUrl ? (
                  <img src={getImageUrl(qrToPrint.qrCodeImageUrl)} alt="QR Code" style={{ width: 'min(250px, 60vw)', aspectRatio: '1 / 1', height: 'auto' }} />
                ) : (
                  <p className="text-danger" style={{ margin: 0 }}>Sản phẩm này chưa có mã QR.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-solid" style={{ flex: 1, background: '#0f766e' }} onClick={handleDownloadQrImage}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {qrDownloading ? 'Đang tải ảnh...' : 'Tải ảnh PNG'}
                </button>
                <button className="btn-solid" style={{ flex: 1 }} onClick={() => window.print()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  In mã QR
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
