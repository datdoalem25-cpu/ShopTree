const twoFactorService = require('../services/twoFactorService');

// GET /api/v1/users/2fa/setup — Tạo QR code
exports.setup = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId.' });

    const data = await twoFactorService.generateSecret(userId);
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// POST /api/v1/users/2fa/enable — Xác nhận mã và bật 2FA
exports.enable = async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ message: 'Thiếu userId hoặc token.' });

    const result = await twoFactorService.enableTwoFactor(userId, token);
    res.json({ status: 'success', ...result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// POST /api/v1/users/2fa/disable — Tắt 2FA
exports.disable = async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ message: 'Thiếu userId hoặc token.' });

    const result = await twoFactorService.disableTwoFactor(userId, token);
    res.json({ status: 'success', ...result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};
