const bcrypt = require('bcrypt');
const User = require('../models/User');
const { verifyToken } = require('./twoFactorService');

const SALT_ROUNDS = 10;

const ensureDefaultAdmin = async () => {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admintest';
  const existingAdmin = await User.findOne({ email: adminEmail, role: 'ADMIN' });
  if (existingAdmin) return existingAdmin;
  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const adminUser = new User({ fullName: 'Quản trị viên Cấp cao', email: adminEmail, password: hashedPassword, role: 'ADMIN' });
  await adminUser.save();
  return adminUser;
};

const registerUser = async (fullName, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw Object.assign(new Error('Email đã tồn tại!'), { statusCode: 400 });
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = new User({ fullName, email, password: hashedPassword, role: 'FARMER' });
  await newUser.save();
  return newUser;
};

/**
 * Đăng nhập — hỗ trợ 2FA
 *
 * Trả về:
 *   - Nếu user KHÔNG có 2FA: trả về thông tin user ngay (đăng nhập thành công)
 *   - Nếu user CÓ 2FA và CHƯA truyền otpToken: trả về { requires2FA: true, userId }
 *   - Nếu user CÓ 2FA và ĐÃ truyền otpToken: verify rồi trả về thông tin user
 */
const loginUser = async (email, password, otpToken = null) => {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('Sai email hoặc mật khẩu!'), { statusCode: 400 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw Object.assign(new Error('Sai email hoặc mật khẩu!'), { statusCode: 400 });

  // Nếu user đã bật 2FA
  if (user.twoFactorEnabled) {
    if (!otpToken) {
      // Trả về tín hiệu yêu cầu nhập mã 2FA (chưa đăng nhập hoàn tất)
      return { requires2FA: true, userId: String(user._id) };
    }

    // Verify mã OTP
    const isValid = verifyToken(user.twoFactorSecret, otpToken);
    if (!isValid) throw Object.assign(new Error('Mã xác thực 2FA không đúng. Vui lòng thử lại.'), { statusCode: 400 });
  }

  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};

module.exports = { registerUser, loginUser, ensureDefaultAdmin };
