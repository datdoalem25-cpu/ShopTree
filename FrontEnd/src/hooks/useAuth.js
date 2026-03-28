import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi } from '../services/api';
import { showAlert } from '../services/dialog';

export function useAuth(requiredRole = null) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      // Redirect nếu không đúng role
      if (requiredRole && parsed.role !== requiredRole) {
        showAlert('Bạn không có quyền truy cập trang này!', { tone: 'danger' });
        navigate('/');
      }
    } else if (requiredRole) {
      // Chưa đăng nhập mà yêu cầu role → về login
      navigate('/');
    }
  }, [requiredRole, navigate]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const result = await loginApi(email, password);
      if (result.ok) {
        localStorage.setItem('user', JSON.stringify(result.data.data));
        setUser(result.data.data);
        if (result.data.data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
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
        navigate('/');
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
    navigate('/');
  };

  return { user, loading, handleLogin, handleRegister, logout };
}
