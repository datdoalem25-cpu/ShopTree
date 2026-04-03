import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showAlert } from '../services/dialog';
import './LoginPage.css';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS = 'admintest';

export default function LoginPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [btnText, setBtnText] = useState('Đăng nhập');
  const [loading, setLoading] = useState(false);
  // ── 2FA ──
  const [show2FA, setShow2FA] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  // ─────────
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (role === 'admin') {
      setIsAdminMode(true);
      setEmail(ADMIN_EMAIL);
      setPassword(ADMIN_PASS);
    } else {
      setIsAdminMode(false);
      setEmail('');
      setPassword('');
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      await showAlert('Vui lòng nhập đầy đủ email và mật khẩu!', { tone: 'warning' });
      return;
    }
    setLoading(true);
    setBtnText('Đang xử lý...');
    const result = await handleLogin(email, password);
    if (result.requires2FA) {
      // Tài khoản bật 2FA → chuyển sang bước nhập OTP
      setPendingUserId(result.userId);
      setPendingEmail(email);
      setPendingPassword(password);
      setShow2FA(true);
      setBtnText('Đăng nhập');
      setLoading(false);
      return;
    }
    if (!result.success) {
      await showAlert(result.message, { tone: 'danger' });
      setBtnText('Đăng nhập');
      setLoading(false);
    }
  };

  const onVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpToken || otpToken.replace(/\s/g, '').length !== 6) {
      await showAlert('Vui lòng nhập mã 6 số từ ứng dụng xác thực.', { tone: 'warning' });
      return;
    }
    setLoading(true);
    setBtnText('Đang xác thực...');
    const result = await handleLogin(pendingEmail, pendingPassword, otpToken.replace(/\s/g, ''));
    if (!result.success) {
      await showAlert(result.message || 'Mã không đúng, thử lại.', { tone: 'danger' });
      setOtpToken('');
      setBtnText('Xác nhận');
      setLoading(false);
    }
  };

  // Bước 2: nhập mã OTP
  if (show2FA) {
    return (
      <div className="login-wrapper">
        <div className="login-bg-pattern"></div>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo" style={{ background: '#fef3c7' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1" fill="#d97706"/>
              </svg>
            </div>
            <h2>Xác thực hai yếu tố</h2>
            <p>Nhập mã 6 số từ ứng dụng Google Authenticator hoặc Authy</p>
          </div>
          <form onSubmit={onVerify2FA} className="login-form">
            <div className="input-with-icon">
              <span className="icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                placeholder="_ _ _ _ _ _"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                style={{ letterSpacing: '0.3em', fontSize: '22px', textAlign: 'center' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {btnText || 'Xác nhận'}
            </button>
          </form>
          <button
            className="btn-outline-orange mt-16"
            onClick={() => { setShow2FA(false); setOtpToken(''); setBtnText('Đăng nhập'); }}
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      {/* Nền Background với họa tiết hoặc gradient */}
      <div className="login-bg-pattern"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14532d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <h2>Quản lý Nông sản</h2>
          <p>Đăng nhập vào hệ thống</p>
        </div>

        <form onSubmit={onLogin} className="login-form">
          <div className="input-with-icon">
            <span className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-with-icon">
            <span className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4v18h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>
            </svg>
            {btnText}
          </button>
        </form>

        <button className="btn-outline-orange mt-16" onClick={() => navigate('/search')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          Tra cứu nguồn gốc sản phẩm
        </button>

        <div className="role-divider">
          <span>Đăng nhập nhanh theo vai trò</span>
        </div>

        <div className="role-buttons">
          <button 
            type="button" 
            className={`btn-role ${!isAdminMode ? 'active' : ''}`}
            onClick={() => handleRoleSelect('farmer')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
            Nông dân
          </button>
          <button 
            type="button" 
            className={`btn-role ${isAdminMode ? 'active' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Quản trị viên
          </button>
        </div>

        <div className="register-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
