const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  farmerId: { type: String, required: true },
  farmerUserId: { type: String },
  name: { type: String, required: true }, 
  description: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }, 
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  productImageUrl: { type: String, required: true },
  batchSerialNumber: { type: String, required: true, unique: true }, 
  qrCodeContent: { type: String, required: true },                   
  qrCodeImageUrl: { type: String, required: true },

  // Lưu thay đổi tạm khi nông dân sửa sản phẩm đã APPROVED
  // Khi admin duyệt → merge vào field chính, xóa pendingUpdate
  pendingUpdate: {
    type: new mongoose.Schema({
      name: String,
      description: String,
      quantity: Number,
      unit: String,
      price: Number,
    }, { _id: false }),
    default: null,
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);
