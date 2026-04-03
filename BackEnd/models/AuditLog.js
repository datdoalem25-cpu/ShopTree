const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action:    { type: String, required: true }, // 'APPROVE_PRODUCT', 'REJECT_PRODUCT', 'CREATE_USER', ...
  actor:     { type: String, required: true }, // tên admin
  actorId:   { type: String },
  target:    { type: String },                 // tên sản phẩm / user bị tác động
  targetId:  { type: String },
  detail:    { type: String, default: '' },
  category:  { type: String, enum: ['PRODUCT', 'USER', 'SYSTEM'], default: 'SYSTEM' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
