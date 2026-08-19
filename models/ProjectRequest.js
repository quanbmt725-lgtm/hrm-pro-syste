const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  type: {
    type: String,
    enum: ['join', 'leave'],
    required: true,
  },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  approverNote: { type: String, default: '' },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);
