const express = require('express');
const router  = express.Router();
const adminController = require('../controllers/adminController');

router.get('/products/pending',       adminController.getPendingProducts);
router.put('/products/:id/status',    adminController.updateStatus);
router.get('/users',                  adminController.getUsers);
router.post('/users',                 adminController.createUser);
router.delete('/users/:id',           adminController.deleteUser);
router.get('/audit-logs',             adminController.getAuditLogs);

module.exports = router;
