const adminService = require('../services/adminService');

// Helper: lấy thông tin admin từ request header (set bởi auth middleware hoặc x-user headers)
const getAdminInfo = (req) => {
  const rawName = req.headers['x-user-name'] || req.headers['x-admin-name'] || '';
  let name = 'Admin';
  try { name = rawName ? decodeURIComponent(rawName) : 'Admin'; } catch { name = rawName || 'Admin'; }
  return {
    name,
    id: req.headers['x-user-id'] || req.headers['x-admin-id'] || null,
  };
};

// GET /api/v1/admin/products/pending
const getPendingProducts = async (req, res) => {
  try {
    const products = await adminService.getPendingProducts();
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// PUT /api/v1/admin/products/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Thiếu trường status.' });
    const { name, id } = getAdminInfo(req);
    const product = await adminService.updateProductStatus(req.params.id, status, name, id);
    res.json({ status: 'success', data: product });
  } catch (error) {
    console.error('[updateStatus] Lỗi:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi cập nhật' });
  }
};

// GET /api/v1/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await adminService.getFarmerUsers();
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// POST /api/v1/admin/users
const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const { name, id } = getAdminInfo(req);
    const user = await adminService.createUserByAdmin({ fullName, email, password, role }, name, id);
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi tạo người dùng.' });
  }
};

// DELETE /api/v1/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { name, id } = getAdminInfo(req);
    await adminService.deleteUserByAdmin(req.params.id, name, id);
    res.json({ status: 'success', message: 'Đã xóa người dùng.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi xóa người dùng.' });
  }
};

// GET /api/v1/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi tải nhật ký.' });
  }
};

module.exports = { getPendingProducts, updateStatus, getUsers, createUser, deleteUser, getAuditLogs };
