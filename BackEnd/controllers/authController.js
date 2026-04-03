const authService = require('../services/authService');

// 1. ĐĂNG KÝ TÀI KHOẢN
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    await authService.registerUser(fullName, email, password);
    res.status(201).json({ status: 'success', message: 'Đăng ký thành công!' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi server.' });
  }
};

// 2. ĐĂNG NHẬP (hỗ trợ 2FA)
const login = async (req, res) => {
  try {
    const { email, password, otpToken } = req.body;  // ← thêm otpToken
    const userData = await authService.loginUser(email, password, otpToken);
    res.status(200).json({ status: 'success', data: userData });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Lỗi server.' });
  }
};

module.exports = { register, login };
