const productService = require('../services/productService');

// NÔNG DÂN LẤY SẢN PHẨM CỦA CHÍNH MÌNH
const getMyProducts = async (req, res) => {
  try {
    const products = await productService.getProductsByOwner(req.user.id, req.user.fullName);
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi lấy danh sách sản phẩm.' });
  }
};

// 3. NÔNG DÂN TẠO LÔ HÀNG (Chờ duyệt)
const createProduct = async (req, res) => {
  try {
    const { name, description, quantity, unit, price } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Thiếu ảnh sản phẩm!' });

    const newProduct = await productService.createProduct({
      farmerName: req.user.fullName,
      farmerUserId: req.user.id,
      name,
      description,
      quantity,
      unit,
      price,
      filename: req.file.filename
    });

    res.status(201).json({ status: 'success', data: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi tạo sản phẩm.' });
  }
};

// 4. NÔNG DÂN CẬP NHẬT SẢN PHẨM
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await productService.updateProductOwned(id, req.body, req.user.id, req.user.fullName);
    res.status(200).json({ status: 'success', data: updatedProduct });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi cập nhật sản phẩm.' });
  }
};

// 5. NÔNG DÂN XÓA SẢN PHẨM
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteProductOwned(id, req.user.id, req.user.fullName);
    res.status(200).json({ status: 'success', message: 'Đã xóa sản phẩm thành công!' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi xóa sản phẩm.' });
  }
};

module.exports = { getMyProducts, createProduct, updateProduct, deleteProduct };
