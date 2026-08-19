const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: { type: String, default: '' },
  skills: [{ type: String, trim: true }],
  performanceScore: { type: Number, default: 7.0, min: 0, max: 10 },
  workloadPercent: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

// Virtual for initials
userSchema.virtual('initials').get(function () {
  return this.fullName
    .split(' ')
    .map(w => w[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join('')
    .toUpperCase();
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
