import { useState } from 'react';
import { changeFullNameApi, changeEmailApi, changePasswordApi, deleteAccountApi } from '../services/api';
import { useAuth } from './useAuth';
import { showAlert, showConfirm, showPrompt } from '../services/dialog';

export function useSettings() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateFullName = async (userId, newFullName) => {
    const value = (newFullName || '').trim();
    if (!value || value.length < 2) {
      return { ok: false, message: 'Họ và tên không hợp lệ.' };
    }

    setLoading(true);
    try {
      const result = await changeFullNameApi(userId, value);
      if (result.ok) {
        return { ok: true, data: result.data?.data };
      }
      return { ok: false, message: result.data.message || 'Lỗi cập nhật họ và tên' };
    } catch (e) {
      console.error(e);
      return { ok: false, message: 'Lỗi kết nối Server' };
    } finally {
      setLoading(false);
    }
  };

  const updateEmailInline = async (userId, newEmail) => {
    const value = (newEmail || '').trim();
    if (!value || !value.includes('@')) {
      return { ok: false, message: 'Email không hợp lệ.' };
    }

    setLoading(true);
    try {
      const result = await changeEmailApi(userId, value);
      if (result.ok) {
        return { ok: true, data: result.data?.data };
      }
      return { ok: false, message: result.data.message || 'Lỗi đổi email' };
    } catch (e) {
      console.error(e);
      return { ok: false, message: 'Lỗi kết nối Server' };
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async (userId) => {
    const newEmail = await showPrompt('Nhập Email mới của bạn:', {
      title: 'Đổi Email',
      confirmText: 'Lưu email',
      cancelText: 'Hủy',
      placeholder: 'example@email.com',
      inputType: 'email',
    });
    if (!newEmail) return;

    setLoading(true);
    try {
      const result = await changeEmailApi(userId, newEmail);
      if (result.ok) {
        await showAlert('Đổi Email thành công! Vui lòng đăng nhập lại.', { tone: 'success' });
        logout();
      } else {
        await showAlert(result.data.message || 'Lỗi đổi email', { tone: 'danger' });
      }
    } catch (e) {
      console.error(e);
      await showAlert('Lỗi kết nối Server', { tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (userId) => {
    const newPassword = await showPrompt('Nhập mật khẩu mới của bạn:', {
      title: 'Đổi mật khẩu',
      confirmText: 'Lưu mật khẩu',
      cancelText: 'Hủy',
      placeholder: 'Nhập mật khẩu mới',
      inputType: 'password',
    });
    if (!newPassword || newPassword.length < 6) {
      await showAlert('Mật khẩu quá ngắn hoặc không hợp lệ.', { tone: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const result = await changePasswordApi(userId, newPassword);
      if (result.ok) {
        await showAlert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.', { tone: 'success' });
        logout();
      } else {
        await showAlert(result.data.message || 'Lỗi đổi mật khẩu', { tone: 'danger' });
      }
    } catch (e) {
      console.error(e);
      await showAlert('Lỗi kết nối Server', { tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (userId) => {
    const confirmed = await showConfirm(
      'Tài khoản và mọi dữ liệu liên quan sẽ mất vĩnh viễn. Bạn có chắc chắn muốn xóa tài khoản không?',
      {
        title: 'Cảnh báo nguy hiểm',
        tone: 'danger',
        confirmText: 'Xóa tài khoản',
        cancelText: 'Hủy',
      }
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteAccountApi(userId);
      if (result.ok) {
        await showAlert('Tài khoản đã bị xóa thành công khỏi hệ thống.', { tone: 'success' });
        logout();
      } else {
        await showAlert(result.data.message || 'Lỗi khi yêu cầu xóa', { tone: 'danger' });
      }
    } catch (e) {
      console.error(e);
      await showAlert('Lỗi kết nối Server', { tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return { loading, updateFullName, updateEmailInline, changeEmail, changePassword, deleteAccount };
}
