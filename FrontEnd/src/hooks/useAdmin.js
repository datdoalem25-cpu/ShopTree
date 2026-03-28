import { useState, useCallback } from 'react';
import {
  getUsersApi,
  getPendingProductsApi,
  updateProductStatusApi,
  createUserByAdminApi,
  getAuditLogsApi,
} from '../services/api';

export function useAdmin() {
  const [users, setUsers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const result = await getUsersApi();
      setUsers(result.data || []);
    } catch (error) {
      console.error('Lỗi:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadPendingProducts = useCallback(async () => {
    setLoadingPending(true);
    try {
      const result = await getPendingProductsApi();
      setPendingProducts(result.data || []);
    } catch (e) {
      console.error('Lỗi load data admin:', e);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const updateStatus = async (productId, newStatus) => {
    try {
      const result = await updateProductStatusApi(productId, newStatus);
      if (!result.ok) {
        return {
          ok: false,
          message: result.message || 'Không thể cập nhật trạng thái lô hàng.'
        };
      }

      await loadPendingProducts();
      return {
        ok: true,
        message:
          newStatus === 'APPROVED'
            ? 'Đã duyệt lô hàng thành công.'
            : 'Đã từ chối lô hàng thành công.'
      };
    } catch {
      return { ok: false, message: 'Lỗi hệ thống.' };
    }
  };

  const createUser = async (payload) => {
    try {
      const result = await createUserByAdminApi(payload);
      if (!result.ok) {
        return { ok: false, message: result.data?.message || 'Không thể tạo người dùng.' };
      }
      await loadUsers();
      return { ok: true, message: 'Tạo người dùng thành công.' };
    } catch {
      return { ok: false, message: 'Lỗi hệ thống khi tạo người dùng.' };
    }
  };

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const result = await getAuditLogsApi();
      if (result.ok) {
        setAuditLogs(result.data?.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải audit logs:', error);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  return {
    users, pendingProducts, auditLogs,
    loadingUsers, loadingPending, loadingAudit,
    loadUsers, loadPendingProducts, loadAuditLogs,
    updateStatus, createUser
  };
}
