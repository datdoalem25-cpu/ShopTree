const User = require('../models/User');

// Đảm bảo luôn có tài khoản admin mặc định để tránh lỗi không đăng nhập được admin
const ensureDefaultAdmin = async () => {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admintest';

  const existingAdmin = await User.findOne({ email: adminEmail, role: 'ADMIN' });
  if (existingAdmin) return existingAdmin;

  const adminUser = new User({
    fullName: 'Quản trị viên Cấp cao',
    email: adminEmail,
    password: adminPassword,
    role: 'ADMIN',
  });

  await adminUser.save();
  return adminUser;
};

// Đăng ký tài khoản mới
const registerUser = async (fullName, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email đã tồn tại!');
    error.statusCode = 400;
    throw error;
  }

  const newUser = new User({ fullName, email, password, role: 'FARMER' });
  await newUser.save();
  return newUser;
};

// Đăng nhập
const loginUser = async (email, password) => {
  const user = await User.findOne({ email, password });
  if (!user) {
    const error = new Error('Sai email hoặc mật khẩu!');
    error.statusCode = 400;
    throw error;
  }

  return { id: user._id, fullName: user.fullName, email: user.email, role: user.role };
};

module.exports = { registerUser, loginUser, ensureDefaultAdmin };
