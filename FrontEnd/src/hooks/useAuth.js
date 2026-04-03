import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi } from '../services/api';
import { showAlert } from '../services/dialog';

export function useAuth(requiredRole = null) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false); // true sau khi đọc xong localStorage
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  // Luôn cập nhật ref để các hàm bên dưới dùng navigate mới nhất
  useEffect(() => {
    navigateRef.current = navigate;
  });

  // Chỉ chạy 1 lần khi mount — KHÔNG đưa navigate vào deps tránh re-run vô hạn
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (requiredRole && parsed.role !== requiredRole) {
          showAlert('Bạn không có quyền truy cập trang này!', { tone: 'danger' });
          navigateRef.current('/');
        }
      } catch {
        // localStorage bị corrupt → xóa và về login
        localStorage.removeItem('user');
        if (requiredRole) navigateRef.current('/');
      }
    } else if (requiredRole) {
      navigateRef.current('/');
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // dependency rỗng: chỉ chạy lúc mount

  const handleLogin = async (email, password, otpToken = null) => {
    setLoading(true);
    try {
      const result = await loginApi(email, password, otpToken);
      if (result.ok) {
        if (result.data?.data?.requires2FA) {
          return { success: false, requires2FA: true, userId: result.data.data.userId };
        }
        localStorage.setItem('user', JSON.stringify(result.data.data));
        setUser(result.data.data);
        if (result.data.data.role === 'ADMIN') {
          navigateRef.current('/admin');
        } else {
          navigateRef.current('/dashboard');
        }
        return { success: true };
      } else {
        return { success: false, message: result.data.message };
      }
    } catch {
      return { success: false, message: 'Lỗi kết nối Server! Vui lòng kiểm tra lại Backend.' };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (fullName, email, password) => {
    setLoading(true);
    try {
      const result = await registerApi(fullName, email, password);
      if (result.ok) {
        showAlert('Đăng ký thành công! Đang chuyển về trang Đăng nhập...', { tone: 'success' });
        navigateRef.current('/');
        return { success: true };
      } else {
        return { success: false, message: result.data.message };
      }
    } catch {
      return { success: false, message: 'Không thể kết nối đến Server!' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigateRef.current('/');
  };

  return { user, loading, ready, handleLogin, handleRegister, logout };
}
