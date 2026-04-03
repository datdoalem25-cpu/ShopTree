import { useState, useEffect, useCallback } from 'react';
import { getMyProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../services/api';
import { showAlert, showConfirm } from '../services/dialog';

export function useProducts(user) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getMyProductsApi(user);
      setProducts(result.data || []);
    } catch (e) {
      console.error('Lỗi load products:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (formData) => {
    try {
      const result = await createProductApi(formData, user);
      if (result.ok) {
        await showAlert('Đã gửi lô hàng! Chờ Admin phê duyệt.', { tone: 'success' });
        loadProducts();
        return true;
      }
      await showAlert(result.message || 'Gửi phê duyệt thất bại. Vui lòng thử lại.', { tone: 'danger' });
    } catch {
      await showAlert('Lỗi server', { tone: 'danger' });
    }
    return false;
  };

  const updateProduct = async (id, data) => {
    try {
      const result = await updateProductApi(id, data, user);
      if (result.ok) {
        // Kiểm tra xem backend có trả về status PENDING không (nghĩa là đã APPROVED trước đó)
        const isPendingReview = result.data?.status === 'PENDING' && result.data?.pendingUpdate != null;
        const message = isPendingReview
          ? 'Yêu cầu sửa đổi đã được gửi! Admin sẽ duyệt trước khi áp dụng.'
          : 'Cập nhật sản phẩm thành công!';
        await showAlert(message, { tone: 'success' });
        loadProducts();
        return true;
      }
    } catch (e) {
      console.error(e);
      await showAlert('Lỗi cập nhật sản phẩm', { tone: 'danger' });
    }
    return false;
  };

  const deleteProduct = async (id) => {
    const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa sản phẩm này?', {
      tone: 'warning',
      title: 'Xác nhận xóa',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });
    if (!confirmed) return false;

    try {
      const result = await deleteProductApi(id, user);
      if (result.ok) {
        await showAlert('Đã xóa sản phẩm!', { tone: 'success' });
        loadProducts();
        return true;
      }
    } catch (e) {
      console.error(e);
      await showAlert('Lỗi xóa sản phẩm', { tone: 'danger' });
    }
    return false;
  };

  // Tính thống kê
  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === 'PENDING').length,
    approved: products.filter(p => p.status === 'APPROVED').length,
    rejected: products.filter(p => p.status === 'REJECTED').length,
  };

  return { products, stats, loading, loadProducts, createProduct, updateProduct, deleteProduct };
}