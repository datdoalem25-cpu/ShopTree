const Product = require('../models/Product');
const User = require('../models/User');

// Lấy danh sách lô hàng chờ duyệt
const getPendingProducts = async () => {
  return await Product.find({ status: 'PENDING' }).sort({ createdAt: -1 });
};

// Cập nhật trạng thái lô hàng (APPROVED / REJECTED)
const updateProductStatus = async (id, status) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: status },
    { new: true }
  );
  if (!product) {
    const error = new Error('Không tìm thấy lô hàng');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

// Lấy danh sách tài khoản Nông dân
const getFarmerUsers = async () => {
  return await User.find().select('-password').sort({ createdAt: -1 });
};

const createUserByAdmin = async ({ fullName, email, password, role }) => {
  const safeName = String(fullName || '').trim();
  const safeEmail = String(email || '').trim().toLowerCase();
  const safePassword = String(password || '').trim();
  const safeRole = String(role || 'FARMER').trim().toUpperCase();

  if (!safeName || !safeEmail || !safePassword) {
    const error = new Error('Vui lòng nhập đầy đủ thông tin người dùng.');
    error.statusCode = 400;
    throw error;
  }

  if (!['USER', 'FARMER', 'ADMIN'].includes(safeRole)) {
    const error = new Error('Vai trò không hợp lệ.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: safeEmail });
  if (existingUser) {
    const error = new Error('Email đã tồn tại.');
    error.statusCode = 409;
    throw error;
  }

  const user = new User({
    fullName: safeName,
    email: safeEmail,
    password: safePassword,
    role: safeRole,
  });

  await user.save();
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const getAuditLogs = async () => {
  const [users, products] = await Promise.all([
    User.find().select('fullName email role createdAt').sort({ createdAt: -1 }).lean(),
    Product.find().select('name status farmerId createdAt').sort({ createdAt: -1 }).lean(),
  ]);

  const userLogs = users.map((u) => ({
    id: `USER-${u._id}`,
    category: 'USER',
    action: 'Tạo tài khoản',
    actor: 'Hệ thống',
    target: `${u.fullName} (${u.email})`,
    detail: `Vai trò: ${u.role}`,
    createdAt: u.createdAt,
  }));

  const productLogs = products.map((p) => ({
    id: `PRODUCT-${p._id}`,
    category: 'PRODUCT',
    action: 'Cập nhật trạng thái lô hàng',
    actor: 'Admin/Hệ thống',
    target: p.name,
    detail: `Trạng thái hiện tại: ${p.status} | Nông dân: ${p.farmerId || 'N/A'}`,
    createdAt: p.createdAt,
  }));

  return [...userLogs, ...productLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

module.exports = { getPendingProducts, updateProductStatus, getFarmerUsers, createUserByAdmin, getAuditLogs };
