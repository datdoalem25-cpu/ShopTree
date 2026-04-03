const Product  = require('../models/Product');
const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');

// ─── Helper: ghi log ────────────────────────────────────────────────────────
const log = async ({ action, actor, actorId, target, targetId, detail, category }) => {
  try {
    await AuditLog.create({ action, actor: actor || 'Admin', actorId, target, targetId, detail, category });
  } catch (e) {
    console.error('Ghi audit log thất bại:', e.message);
  }
};

// ─── Lô hàng chờ duyệt ──────────────────────────────────────────────────────
const getPendingProducts = async () => {
  return await Product.find({ status: 'PENDING' }).sort({ createdAt: -1 });
};

// ─── Duyệt / Từ chối lô hàng ────────────────────────────────────────────────
const updateProductStatus = async (id, status, adminName, adminId) => {
  // Fetch product trước để build updatePayload và ghi log
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error('Không tìm thấy lô hàng');
    error.statusCode = 404;
    throw error;
  }

  // Build update payload
  const updatePayload = { status };
  if (status === 'APPROVED' && product.pendingUpdate) {
    const { name, description, quantity, unit, price } = product.pendingUpdate;
    if (name        !== undefined) updatePayload.name        = name;
    if (description !== undefined) updatePayload.description = description;
    if (quantity    !== undefined) updatePayload.quantity    = quantity;
    if (unit        !== undefined) updatePayload.unit        = unit;
    if (price       !== undefined) updatePayload.price       = price;
    updatePayload.pendingUpdate = null;
  } else if (status === 'REJECTED') {
    updatePayload.pendingUpdate = null;
  }

  // Dùng findByIdAndUpdate để tránh full-document validation khi save()
  const updated = await Product.findByIdAndUpdate(id, updatePayload, { new: true });

  // Ghi log
  const actionLabel = status === 'APPROVED' ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT';
  const detailLabel = status === 'APPROVED' ? 'Duyệt lô hàng' : 'Từ chối lô hàng';
  await log({
    action:   actionLabel,
    actor:    adminName,
    actorId:  adminId,
    target:   product.name,
    targetId: String(product._id),
    detail:   `${detailLabel}: "${product.name}" (Nông dân: ${product.farmerId || 'N/A'})`,
    category: 'PRODUCT',
  });

  return updated;
};

// ─── Danh sách người dùng ────────────────────────────────────────────────────
const getFarmerUsers = async () => {
  return await User.find().select('-password').sort({ createdAt: -1 });
};

// ─── Tạo người dùng ─────────────────────────────────────────────────────────
const createUserByAdmin = async ({ fullName, email, password, role }, adminName, adminId) => {
  const safeName     = String(fullName  || '').trim();
  const safeEmail    = String(email     || '').trim().toLowerCase();
  const safePassword = String(password  || '').trim();
  const safeRole     = String(role      || 'FARMER').trim().toUpperCase();

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

  const user = new User({ fullName: safeName, email: safeEmail, password: safePassword, role: safeRole });
  await user.save();

  // Ghi log
  await log({
    action:   'CREATE_USER',
    actor:    adminName,
    actorId:  adminId,
    target:   `${safeName} (${safeEmail})`,
    targetId: String(user._id),
    detail:   `Tạo tài khoản mới — Vai trò: ${safeRole}`,
    category: 'USER',
  });

  return { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, createdAt: user.createdAt };
};

// ─── Xóa người dùng ─────────────────────────────────────────────────────────
const deleteUserByAdmin = async (targetUserId, adminName, adminId) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  await User.findByIdAndDelete(targetUserId);

  await log({
    action:   'DELETE_USER',
    actor:    adminName,
    actorId:  adminId,
    target:   `${user.fullName} (${user.email})`,
    targetId: String(user._id),
    detail:   `Xóa tài khoản — Vai trò: ${user.role}`,
    category: 'USER',
  });
};

// ─── Đọc audit logs ──────────────────────────────────────────────────────────
const getAuditLogs = async () => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
  return logs.map((l) => ({
    id:        String(l._id),
    category:  l.category,
    action:    l.action,
    actor:     l.actor,
    target:    l.target  || '—',
    detail:    l.detail  || '',
    createdAt: l.createdAt,
  }));
};

module.exports = { getPendingProducts, updateProductStatus, getFarmerUsers, createUserByAdmin, deleteUserByAdmin, getAuditLogs };
