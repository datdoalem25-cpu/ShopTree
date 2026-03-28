import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import ApprovalCard from '../components/ApprovalCard';
import UserRow from '../components/UserRow';
import { showAlert, showConfirm } from '../services/dialog';
import './AdminPage.css';

export default function AdminPage() {
  const { user, logout } = useAuth('ADMIN');
  const {
    users,
    pendingProducts,
    auditLogs,
    loadUsers,
    loadPendingProducts,
    loadAuditLogs,
    updateStatus,
    createUser,
    loadingAudit,
  } = useAdmin();
  const [activeTab, setActiveTab] = useState('tab-overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    role: 'FARMER',
    password: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const importInputRef = useRef(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    product: null,
    nextStatus: 'APPROVED',
    isSubmitting: false,
  });
  const [resultPopup, setResultPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    tone: 'success',
  });

  useEffect(() => {
    loadUsers();
    loadPendingProducts();
  }, [loadUsers, loadPendingProducts]);

  useEffect(() => {
    if (activeTab === 'tab-logs') {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      const matchesTerm = !term || fullName.includes(term) || email.includes(term);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      const isActive = true;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      const createdDate = new Date(u.createdAt);
      const matchesFrom = !dateFrom || createdDate >= new Date(`${dateFrom}T00:00:00`);
      const matchesTo = !dateTo || createdDate <= new Date(`${dateTo}T23:59:59`);

      return matchesTerm && matchesRole && matchesStatus && matchesFrom && matchesTo;
    });
  }, [users, searchTerm, roleFilter, statusFilter, dateFrom, dateTo]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'tab-users') loadUsers();
    if (tabId === 'tab-overview') loadPendingProducts();
    if (tabId === 'tab-logs') loadAuditLogs();
  };

  const handleRefresh = () => {
    if (activeTab === 'tab-users') loadUsers();
    if (activeTab === 'tab-overview') loadPendingProducts();
    if (activeTab === 'tab-logs') loadAuditLogs();
  };

  const resetAdvancedFilter = () => {
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);

    const payload = {
      fullName: newUser.fullName.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      password: newUser.password.trim() || '123456',
    };

    const result = await createUser(payload);
    setCreatingUser(false);

    if (!result.ok) {
      await showAlert(result.message, { tone: 'danger' });
      return;
    }

    setShowCreateUserModal(false);
    setNewUser({ fullName: '', email: '', role: 'FARMER', password: '' });
    await showAlert('Đã thêm người dùng thành công.', { tone: 'success' });
  };

  const parseCsv = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const hasHeader = /name|email|role|password|ho\s*ten|fullName/i.test(lines[0]);
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const [fullName = '', email = '', role = 'FARMER', password = '123456'] = line
        .split(',')
        .map((v) => v.trim());
      return { fullName, email, role: role.toUpperCase(), password };
    });
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      await showAlert('File rỗng hoặc không đúng định dạng CSV.', { tone: 'warning' });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      if (!row.fullName || !row.email) {
        failedCount += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const result = await createUser(row);
      if (result.ok) successCount += 1;
      else failedCount += 1;
    }

    await showAlert(
      `Import hoàn tất. Thành công: ${successCount}. Thất bại: ${failedCount}.`,
      { tone: failedCount > 0 ? 'warning' : 'success' }
    );
  };

  const handleExportAuditReport = async () => {
    if (!auditLogs.length) {
      await showAlert('Chưa có dữ liệu audit để xuất báo cáo.', { tone: 'warning' });
      return;
    }

    const header = ['ThoiGian', 'Nhom', 'HanhDong', 'TacNhan', 'DoiTuong', 'ChiTiet'];
    const csvRows = auditLogs.map((item) => [
      new Date(item.createdAt).toLocaleString('vi-VN'),
      item.category,
      item.action,
      item.actor,
      item.target,
      item.detail,
    ]);

    const csv = [header, ...csvRows]
      .map((row) => row.map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const openApprovalConfirm = (product, nextStatus) => {
    setConfirmState({
      isOpen: true,
      product,
      nextStatus,
      isSubmitting: false,
    });
  };

  const closeApprovalConfirm = () => {
    if (confirmState.isSubmitting) return;
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  const closeResultPopup = () => {
    setResultPopup((prev) => ({ ...prev, isOpen: false }));
  };

  const submitApproval = async () => {
    if (!confirmState.product?._id) return;

    setConfirmState((prev) => ({ ...prev, isSubmitting: true }));
    const result = await updateStatus(confirmState.product._id, confirmState.nextStatus);

    setConfirmState({
      isOpen: false,
      product: null,
      nextStatus: 'APPROVED',
      isSubmitting: false,
    });

    setResultPopup({
      isOpen: true,
      title: result?.ok ? 'Cập nhật thành công' : 'Không thể cập nhật',
      message: result?.message || 'Đã xảy ra lỗi không xác định.',
      tone: result?.ok ? 'success' : 'danger',
    });
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

  if (!user) return null;

  const getPageTitle = () => {
    if (activeTab === 'tab-overview') return 'Tổng quan hệ thống';
    if (activeTab === 'tab-users') return 'Quản lý người dùng';
    if (activeTab === 'tab-logs') return 'Nhật ký audit';
    return 'Admin Central';
  };

  const StatCard = ({ label, value, icon, color }) => (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-icon" style={{ backgroundColor: color + '20', color: color }}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          Admin Central
        </div>
        
        <nav className="sidebar-menu">
          <button className={`menu-item ${activeTab === 'tab-overview' ? 'active' : ''}`} onClick={() => switchTab('tab-overview')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Tổng quan
          </button>
          <button className={`menu-item ${activeTab === 'tab-users' ? 'active' : ''}`} onClick={() => switchTab('tab-users')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Người dùng
          </button>
          <button className={`menu-item ${activeTab === 'tab-logs' ? 'active' : ''}`} onClick={() => switchTab('tab-logs')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Nhật ký hệ thống
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile-card">
            <div className="avatar-badge">Q</div>
            <div className="admin-meta">
               <h4>{user.fullName}</h4>
               <p>Administrator</p>
            </div>
          </div>
          <button className="logout-link" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="top-nav">
          <div className="nav-left">
            <button className="hamburger-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="nav-title">{getPageTitle()}</h1>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            Làm mới
          </button>
        </header>

        <div className="admin-page-body">
          {activeTab === 'tab-overview' && (
            <div className="fade-in">
               <div className="stats-grid">
                  <StatCard label="Tổng người dùng" value={users.length} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} color="#2563eb" />
                  <StatCard label="Người dùng mới (tháng)" value="12" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>} color="#16a34a" />
                  <StatCard label="Vô hiệu hóa" value="0" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>} color="#dc2626" />
                  <StatCard label="Hoạt động audit (24h)" value="0" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>} color="#7c3aed" />
               </div>

               <div className="overview-grid">
                  <div className="recent-card">
                    <h3>Người dùng mới gần đây</h3>
                    <div className="table-wrapper">
                       <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Họ tên</th>
                              <th>Vai trò</th>
                              <th>Ngày tạo</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.slice(0, 5).map(u => (
                              <tr key={u._id}>
                                <td>{u.fullName}</td>
                                <td><span className={`admin-badge ${u.role === 'ADMIN' ? 'badge-admin-purple' : 'badge-farmer-green'}`}>{u.role === 'ADMIN' ? 'Quản trị viên' : 'Nông dân'}</span></td>
                                <td className="text-xs">{new Date(u.createdAt).toISOString().split('T')[0]}</td>
                                <td><span className="admin-badge badge-active-green">Đang hoạt động</span></td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                  <div className="recent-card">
                    <h3>Hoạt động gần đây</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'clamp(140px, 24vw, 200px)', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                       Chưa có hoạt động nào
                    </div>
                  </div>
               </div>

               <div className="table-container mb-24" style={{ padding: '24px', marginTop: '24px' }}>
                  <h3 style={{ marginTop: 0 }}>📦 Lô hàng chờ duyệt</h3>
                  {pendingProducts.length === 0 ? (
                    <p style={{ color: '#888', padding: '20px' }}>🎉 Tuyệt vời! Không còn lô hàng nào đang chờ duyệt.</p>
                  ) : (
                    pendingProducts.map(p => (
                      <ApprovalCard 
                        key={p._id} 
                        product={p}
                        onApprove={() => openApprovalConfirm(p, 'APPROVED')}
                        onReject={() => openApprovalConfirm(p, 'REJECTED')}
                      />
                    ))
                  )}
               </div>
            </div>
          )}

          {activeTab === 'tab-users' && (
            <div className="fade-in">
               <div className="user-filter-bar">
                  <div className="filter-left">
                    <div className="search-input-wrapper">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                       <input
                         type="text"
                         placeholder="Tìm kiếm theo tên hoặc email..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <select className="role-dropdown" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                       <option value="ALL">Tất cả vai trò</option>
                       <option value="FARMER">Nông dân</option>
                       <option value="ADMIN">Quản trị viên</option>
                       <option value="USER">Người dùng</option>
                    </select>
                    <button className="btn-ghost-outline" onClick={() => setShowAdvancedFilter((prev) => !prev)}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                       Lọc nâng cao
                    </button>
                    <button className="btn-ghost-outline" onClick={() => importInputRef.current?.click()}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                       Import Excel
                    </button>
                    <input ref={importInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImportCsv} />
                  </div>
                  <button className="btn-primary-purple" onClick={() => setShowCreateUserModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Thêm người dùng
                  </button>
               </div>

               {showAdvancedFilter && (
                 <div className="user-filter-bar" style={{ marginTop: '12px' }}>
                   <div className="filter-left" style={{ width: '100%' }}>
                     <select className="role-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                       <option value="ALL">Tất cả trạng thái</option>
                       <option value="ACTIVE">Đang hoạt động</option>
                       <option value="INACTIVE">Ngừng hoạt động</option>
                     </select>
                     <input className="input-modern" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                     <input className="input-modern" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                     <button className="btn-ghost-outline" onClick={resetAdvancedFilter}>Xóa lọc</button>
                   </div>
                 </div>
               )}

               <div className="table-wrapper">
                 <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <UserRow key={u._id} user={u} />
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '28px' }}>
                            Không tìm thấy người dùng phù hợp bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'tab-logs' && (
            <div className="fade-in">
               <div className="recent-card">
                  <div className="flex-between mb-24">
                     <div>
                        <h3>Dữ liệu Audit</h3>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>Toàn bộ lịch sử thay đổi quyền và trạng thái hệ thống</p>
                     </div>
                     <button className="refresh-btn" onClick={handleExportAuditReport}>Xuất báo cáo</button>
                  </div>

                  {loadingAudit ? (
                    <div className="audit-empty"><p>Đang tải dữ liệu audit...</p></div>
                  ) : auditLogs.length === 0 ? (
                    <div className="audit-empty">
                       <div className="icon-bg">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                       </div>
                       <p>Chưa có bản ghi nhật ký hệ thống nào</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Thời gian</th>
                            <th>Nhóm</th>
                            <th>Hành động</th>
                            <th>Tác nhân</th>
                            <th>Đối tượng</th>
                            <th>Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="text-xs">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                              <td>{log.category}</td>
                              <td>{log.action}</td>
                              <td>{log.actor}</td>
                              <td>{log.target}</td>
                              <td>{log.detail}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {showCreateUserModal && (
        <div className="admin-popup-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="admin-popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Thêm người dùng</h3>
            <p>Tạo tài khoản mới cho hệ thống. Nếu bỏ trống mật khẩu sẽ mặc định là 123456.</p>
            <form onSubmit={handleCreateUser} className="modal-form" style={{ marginTop: '12px' }}>
              <input
                className="admin-popup-input"
                type="text"
                required
                placeholder="Họ và tên"
                value={newUser.fullName}
                onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))}
              />
              <input
                className="admin-popup-input"
                type="email"
                required
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              />
              <select
                className="admin-popup-input"
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="FARMER">Nông dân</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="USER">Người dùng</option>
              </select>
              <input
                className="admin-popup-input"
                type="text"
                placeholder="Mật khẩu (mặc định 123456)"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              />
              <div className="admin-popup-actions">
                <button type="button" className="admin-popup-btn ghost" onClick={() => setShowCreateUserModal(false)}>Hủy</button>
                <button type="submit" className="admin-popup-btn primary approve" disabled={creatingUser}>
                  {creatingUser ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmState.isOpen && (
        <div className="admin-popup-overlay" onClick={closeApprovalConfirm}>
          <div className="admin-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className={`admin-popup-icon ${confirmState.nextStatus === 'APPROVED' ? 'is-approve' : 'is-reject'}`}>
              {confirmState.nextStatus === 'APPROVED' ? '✓' : '!'}
            </div>
            <h3>
              {confirmState.nextStatus === 'APPROVED'
                ? 'Xác nhận duyệt lô hàng'
                : 'Xác nhận từ chối lô hàng'}
            </h3>
            <p>
              {confirmState.nextStatus === 'APPROVED'
                ? 'Bạn muốn phê duyệt lô hàng này vào hệ thống?'
                : 'Bạn muốn từ chối lô hàng này? Hành động này sẽ cập nhật trạng thái ngay.'}
            </p>
            <div className="admin-popup-product-name">{confirmState.product?.name || 'Lô hàng chưa đặt tên'}</div>

            <div className="admin-popup-actions">
              <button
                type="button"
                className="admin-popup-btn ghost"
                onClick={closeApprovalConfirm}
                disabled={confirmState.isSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`admin-popup-btn primary ${confirmState.nextStatus === 'APPROVED' ? 'approve' : 'reject'}`}
                onClick={submitApproval}
                disabled={confirmState.isSubmitting}
              >
                {confirmState.isSubmitting
                  ? 'Đang xử lý...'
                  : confirmState.nextStatus === 'APPROVED'
                    ? 'Xác nhận duyệt'
                    : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultPopup.isOpen && (
        <div className="admin-popup-overlay" onClick={closeResultPopup}>
          <div className="admin-popup-card small" onClick={(e) => e.stopPropagation()}>
            <h3>{resultPopup.title}</h3>
            <p>{resultPopup.message}</p>
            <button
              type="button"
              className={`admin-popup-btn primary ${resultPopup.tone === 'success' ? 'approve' : 'reject'}`}
              onClick={closeResultPopup}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
