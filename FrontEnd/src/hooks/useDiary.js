import { useState, useCallback } from 'react';
import { getDiariesApi, createDiaryApi } from '../services/api';

export function useDiary(user) {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDiaries = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await getDiariesApi(user);
      if (result.status === 'success') {
        setDiaries(result.data || []);
      }
    } catch (e) {
      console.error('Lỗi tải nhật ký:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addDiary = async (data) => {
    try {
      const result = await createDiaryApi(data, user);
      if (result.ok) {
        loadDiaries(); // re-fetch locally
        return { ok: true, message: 'Đã thêm nhật ký thành công!' };
      } else {
        return { ok: false, message: result.data.message || 'Thêm nhật ký thất bại' };
      }
    } catch (e) {
      console.error(e);
      return { ok: false, message: 'Lỗi kết nối Server' };
    }
  };

  return { diaries, loading, loadDiaries, addDiary };
}
