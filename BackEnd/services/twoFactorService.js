const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

const APP_NAME = 'ShopTree Nông sản';

/**
 * Bước 1: Tạo secret và trả về QR code để user quét
 * Secret được lưu TẠM vào DB nhưng chưa enable 2FA
 */
const generateSecret = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại.'), { statusCode: 404 });

  // Tạo secret TOTP mới
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${user.email})`,
    length: 20,
  });

  // Lưu tạm secret (chưa enable, user cần verify trước)
  await User.findByIdAndUpdate(userId, { twoFactorSecret: secret.base32 });

  // Tạo QR code dạng data URL để hiển thị trên frontend
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,      // hiển thị cho user nhập tay (backup)
    qrCodeUrl: qrDataUrl,       // ảnh QR để quét
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * Bước 2: Verify mã 6 số user nhập — nếu đúng thì bật 2FA
 */
const enableTwoFactor = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại.'), { statusCode: 404 });
  if (!user.twoFactorSecret) throw Object.assign(new Error('Chưa khởi tạo 2FA. Hãy quét QR trước.'), { statusCode: 400 });

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1, // cho phép lệch ±30 giây
  });

  if (!isValid) throw Object.assign(new Error('Mã xác thực không đúng. Vui lòng thử lại.'), { statusCode: 400 });

  await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });
  return { message: 'Đã bật xác thực hai yếu tố thành công!' };
};

/**
 * Tắt 2FA
 */
const disableTwoFactor = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại.'), { statusCode: 404 });
  if (!user.twoFactorEnabled) throw Object.assign(new Error('2FA chưa được bật.'), { statusCode: 400 });

  // Yêu cầu xác nhận bằng mã hiện tại trước khi tắt
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1,
  });

  if (!isValid) throw Object.assign(new Error('Mã xác thực không đúng.'), { statusCode: 400 });

  await User.findByIdAndUpdate(userId, { twoFactorEnabled: false, twoFactorSecret: null });
  return { message: 'Đã tắt xác thực hai yếu tố.' };
};

/**
 * Dùng trong login: kiểm tra mã TOTP
 */
const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1,
  });
};

module.exports = { generateSecret, enableTwoFactor, disableTwoFactor, verifyToken };
