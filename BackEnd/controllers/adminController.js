const adminService = require('../services/adminService');

// 6. ADMIN LẤY DANH SÁCH LÔ HÀNG CHỜ DUYỆT
const getPendingProducts = async (req, res) => {
  try {
    const products = await adminService.getPendingProducts();
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// 7. ADMIN CẬP NHẬT TRẠNG THÁI (DUYỆT/TỪ CHỐI)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await adminService.updateProductStatus(req.params.id, status);
    res.json({ status: 'success', data: product });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi cập nhật' });
  }
};

// 8. ADMIN LẤY DANH SÁCH TÀI KHOẢN NÔNG DÂN
const getUsers = async (req, res) => {
  try {
    const users = await adminService.getFarmerUsers();
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const user = await adminService.createUserByAdmin({ fullName, email, password, role });
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi tạo người dùng.' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi tải nhật ký audit.' });
  }
};

module.exports = { getPendingProducts, updateStatus, getUsers, createUser, getAuditLogs };
