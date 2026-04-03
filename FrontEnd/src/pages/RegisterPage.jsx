import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showAlert } from '../services/dialog';
import './RegisterPage.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [btnText, setBtnText] = useState('Đăng ký tài khoản');
  const [disabled, setDisabled] = useState(false);
  const { handleRegister } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword  || password.length < 8) {
      await showAlert('Mật khẩu xác nhận không khớp hoặc mật khẩu quá ngắn!', { tone: 'warning' });
      return;
    }
    setBtnText('Đang xử lý...');
    setDisabled(true);

    const result = await handleRegister(fullName, email, password);
    if (!result.success) {
      await showAlert(result.message, { tone: 'danger' });
    }
    setBtnText('Đăng ký tài khoản');
    setDisabled(false);
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <div className="logo">📝</div>
        <h2>Tạo tài khoản mới</h2>
        <p>Đăng ký để trở thành Nông dân trên hệ thống</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Họ và Tên</label>
            <input type="text" placeholder="VD: Nguyễn Văn A" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email liên hệ</label>
            <input type="email" placeholder="example@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-register" disabled={disabled}>{btnText}</button>
        </form>

        <div className="footer-text">
          Đã có tài khoản? <Link to="/">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
