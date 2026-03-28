const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');
const farmerController = require('../controllers/farmerController');
const diaryController = require('../controllers/diaryController');

router.use(requireAuth, requireRole('FARMER'));

// GET /api/v1/farmer/products
router.get('/products', farmerController.getMyProducts);

// POST /api/v1/farmer/products
router.post('/products', upload.single('productImage'), farmerController.createProduct);

// API Nhật ký
router.post('/diary', diaryController.addDiary);
router.get('/diary', diaryController.getDiaries);

// Sửa và Xóa sản phẩm
router.patch('/products/:id', farmerController.updateProduct);
router.delete('/products/:id', farmerController.deleteProduct);

module.exports = router;
