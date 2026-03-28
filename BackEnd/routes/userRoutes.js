const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Quản lý Settings
router.put('/settings/name', userController.changeFullName);
router.put('/settings/email', userController.changeEmail);
router.put('/settings/password', userController.changePassword);
router.delete('/settings/account/:userId', userController.deleteAccount);

module.exports = router;
