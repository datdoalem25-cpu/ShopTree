const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema({
  farmerId: { type: String, required: true },
  productId: { type: String, required: true },
  activityTitle: { type: String, required: true },
  cropLabel: { type: String, required: true },
  description: { type: String, required: true },
  actionDate: { type: Date, required: true },
  recordedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Diary', DiarySchema);
