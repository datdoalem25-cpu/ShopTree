const bcrypt = require('bcrypt');
const User = require('../models/User');

const SALT_ROUNDS = 10;

exports.updateFullName = async (userId, newFullName) => {
  return await User.findByIdAndUpdate(userId, { fullName: newFullName }, { new: true });
};

exports.updateEmail = async (userId, newEmail) => {
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser && existingUser._id.toString() !== userId) {
    throw new Error('Email này đã được sử dụng bởi tài khoản khác');
  }

  return await User.findByIdAndUpdate(userId, { email: newEmail }, { new: true });
};

exports.updatePassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};

exports.deleteAccount = async (userId) => {
  return await User.findByIdAndDelete(userId);
};