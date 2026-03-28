const Diary = require('../models/Diary');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const buildOwnerFilter = (ownerId, ownerName) => ({
  $or: [
    { farmerUserId: ownerId },
    { farmerUserId: { $exists: false }, farmerId: ownerName },
    { farmerUserId: null, farmerId: ownerName },
  ],
});

exports.createDiaryEntry = async (data) => {
  const diary = new Diary(data);
  return await diary.save();
};

exports.getFarmerDiaries = async (farmerId) => {
  return await Diary.find({ farmerId }).sort({ actionDate: -1, recordedAt: -1 });
};

exports.getEligibleDiaryProduct = async ({ productId, ownerId, ownerName }) => {
  return await Product.findOne({
    _id: productId,
    status: { $in: ['PENDING', 'APPROVED'] },
    ...buildOwnerFilter(ownerId, ownerName),
  }).select('_id name status farmerId farmerUserId');
};

exports.getProductDiariesForTracking = async (product) => {
  if (!product?._id) return [];

  const productId = String(product._id);
  const conditions = [{ productId }];

  if (mongoose.Types.ObjectId.isValid(productId)) {
    conditions.push({ productId: new mongoose.Types.ObjectId(productId) });
  }

  // Fallback for old diary records before productId was introduced.
  if (product?.name) {
    const escaped = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    conditions.push({ cropLabel: new RegExp(`^${escaped}$`, 'i') });
  }

  if (product?.farmerUserId) {
    conditions.push({ farmerId: String(product.farmerUserId) });
  }

  const rows = await Diary.find({ $or: conditions })
    .sort({ actionDate: -1, recordedAt: -1 })
    .select('activityTitle cropLabel description actionDate recordedAt');

  // Prefer diaries directly linked to this product; fallback to same farmer only when needed.
  const exactRows = rows.filter((row) => {
    const rowProductId = String(row.productId || '');
    const rowCropLabel = String(row.cropLabel || '').trim().toLowerCase();
    const productName = String(product.name || '').trim().toLowerCase();
    return rowProductId === productId || (rowCropLabel && rowCropLabel === productName);
  });

  if (exactRows.length > 0) {
    return exactRows;
  }

  return rows.slice(0, 30);
};
