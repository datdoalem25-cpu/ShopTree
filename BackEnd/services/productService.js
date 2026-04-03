const { randomUUID } = require('crypto');
const QRCode = require('qrcode');
const Product = require('../models/Product');
const { uploadBuffer, uploadDataUrl } = require('../config/cloudinary');

const buildOwnerFilter = (ownerId, ownerName) => ({
  $or: [
    { farmerUserId: ownerId },
    { farmerUserId: { $exists: false }, farmerId: ownerName },
    { farmerUserId: null, farmerId: ownerName },
  ],
});

// Nông dân tạo lô hàng mới (chờ duyệt)
const createProduct = async ({ farmerName, farmerUserId, name, description, quantity, unit, price, imageBuffer, imageMimeType }) => {
  if (!imageBuffer) {
    const error = new Error('Thiếu ảnh sản phẩm để upload.');
    error.statusCode = 400;
    throw error;
  }

  if (imageMimeType && !String(imageMimeType).startsWith('image/')) {
    const error = new Error('Tệp upload phải là ảnh hợp lệ.');
    error.statusCode = 400;
    throw error;
  }

  const batchToken = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  const batchSerialNumber = `BAT-${batchToken}`;
  const publicBaseUrl = (process.env.FRONTEND_ORIGIN || '').replace(/\/$/, '');
  const fallbackTrackBase = (process.env.PUBLIC_TRACK_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const trackBaseUrl = publicBaseUrl || fallbackTrackBase;
  const qrCodeContent = `${trackBaseUrl}/track?id=${batchSerialNumber}`;

  const safeBatch = batchSerialNumber.toLowerCase();
  const productImageUpload = await uploadBuffer({
    buffer: imageBuffer,
    folder: 'nongsan/products',
    publicId: `product-${safeBatch}`,
  });

  const qrDataUrl = await QRCode.toDataURL(qrCodeContent, { margin: 1, width: 720 });
  const qrImageUpload = await uploadDataUrl({
    dataUrl: qrDataUrl,
    folder: 'nongsan/qrcodes',
    publicId: `qr-${safeBatch}`,
  });

  const newProduct = new Product({
    farmerId: farmerName,
    farmerUserId,
    name,
    description: description || '',
    quantity,
    unit,
    price,
    productImageUrl: productImageUpload.secure_url,
    batchSerialNumber,
    qrCodeContent,
    qrCodeImageUrl: qrImageUpload.secure_url,
    status: 'PENDING',
    pendingUpdate: null,
  });

  await newProduct.save();
  return newProduct;
};

// Lấy tất cả sản phẩm
const getAllProducts = async () => {
  return await Product.find().sort({ createdAt: -1 });
};

// Lấy sản phẩm theo chủ sở hữu
const getProductsByOwner = async (ownerId, ownerName) => {
  return await Product.find(buildOwnerFilter(ownerId, ownerName)).sort({ createdAt: -1 });
};

// Tra cứu sản phẩm theo mã lô
const trackProduct = async (batchSerial) => {
  const product = await Product.findOne({ batchSerialNumber: batchSerial });
  if (!product) {
    const error = new Error('Không tìm thấy lô hàng này!');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

// Cập nhật sản phẩm (nội bộ, không kiểm tra quyền)
const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!product) {
    const error = new Error('Không tìm thấy sản phẩm!');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

/**
 * Nông dân sửa sản phẩm (có kiểm tra quyền sở hữu).
 *
 * - Nếu status === 'APPROVED': lưu vào pendingUpdate, đặt status = 'PENDING' → admin duyệt lại
 * - Nếu status === 'PENDING' hoặc 'REJECTED': cập nhật trực tiếp
 */
const updateProductOwned = async (id, data, ownerId, ownerName) => {
  const allowedFields = ['name', 'description', 'quantity', 'unit', 'price'];
  const safeUpdate = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      safeUpdate[field] = data[field];
    }
  });

  // BUG FIX: findOne chỉ nhận filter, KHÔNG truyền safeUpdate vào đây
  const existing = await Product.findOne({
    _id: id,
    ...buildOwnerFilter(ownerId, ownerName),
  });

  if (!existing) {
    const error = new Error('Bạn không có quyền chỉnh sửa sản phẩm này hoặc sản phẩm không tồn tại!');
    error.statusCode = 403;
    throw error;
  }

  let updatePayload;
  if (existing.status === 'APPROVED') {
    // Sản phẩm đã duyệt → lưu tạm, chờ admin duyệt lại
    updatePayload = { pendingUpdate: safeUpdate, status: 'PENDING' };
  } else {
    // PENDING / REJECTED → cập nhật thẳng
    updatePayload = { ...safeUpdate, pendingUpdate: null };
  }

  // BUG FIX: phải dùng { _id: id } chứ không phải id trực tiếp
  const product = await Product.findOneAndUpdate(
    { _id: id, ...buildOwnerFilter(ownerId, ownerName) },
    updatePayload,
    { new: true }
  );

  return product;
};

// Xóa sản phẩm (nội bộ)
const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    const error = new Error('Không tìm thấy sản phẩm!');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

// Xóa sản phẩm (có kiểm tra quyền)
const deleteProductOwned = async (id, ownerId, ownerName) => {
  const product = await Product.findOneAndDelete({
    _id: id,
    ...buildOwnerFilter(ownerId, ownerName),
  });
  if (!product) {
    const error = new Error('Bạn không có quyền xóa sản phẩm này hoặc sản phẩm không tồn tại!');
    error.statusCode = 403;
    throw error;
  }
  return product;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductsByOwner,
  trackProduct,
  updateProduct,
  updateProductOwned,
  deleteProduct,
  deleteProductOwned,
};
