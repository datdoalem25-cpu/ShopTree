const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: thiếu định danh người dùng.' });
    }

    const user = await User.findById(userId).select('_id fullName role');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: tài khoản không tồn tại.' });
    }

    req.user = {
      id: String(user._id),
      fullName: user.fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: định danh không hợp lệ.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: không đủ quyền truy cập.' });
  }

  next();
};

module.exports = { requireAuth, requireRole };