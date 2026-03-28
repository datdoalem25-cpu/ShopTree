const userService = require('../services/userService');

exports.changeFullName = async (req, res) => {
  try {
    const { userId, newFullName } = req.body;
    if (!userId || !newFullName) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin yêu cầu' });
    }

    const trimmedName = String(newFullName).trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ status: 'error', message: 'Họ và tên không hợp lệ' });
    }

    const updatedUser = await userService.updateFullName(userId, trimmedName);
    res.status(200).json({ status: 'success', data: updatedUser, message: 'Cập nhật họ và tên thành công' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    if (!userId || !newEmail) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin yêu cầu' });
    }

    const updatedUser = await userService.updateEmail(userId, newEmail);
    res.status(200).json({ status: 'success', data: updatedUser, message: 'Cập nhật Email thành công' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin mật khẩu mới' });
    }

    await userService.updatePassword(userId, newPassword);
    res.status(200).json({ status: 'success', message: 'Cập nhật mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu User ID' });
    }

    await userService.deleteAccount(userId);
    res.status(200).json({ status: 'success', message: 'Tài khoản đã bị xóa vĩnh viễn' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
