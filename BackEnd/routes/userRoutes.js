const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const twoFactorController = require('../controllers/twoFactorController');

// Quản lý Settings
router.put('/settings/name', userController.changeFullName);
router.put('/settings/email', userController.changeEmail);
router.put('/settings/password', userController.changePassword);
router.delete('/settings/account/:userId', userController.deleteAccount);

// ── 2FA ──────────────────────────────────────────
router.get('/2fa/setup', twoFactorController.setup);      // lấy QR code
router.post('/2fa/enable', twoFactorController.enable);   // bật 2FA
router.post('/2fa/disable', twoFactorController.disable); // tắt 2FA
// ─────────────────────────────────────────────────

module.exports = router;
