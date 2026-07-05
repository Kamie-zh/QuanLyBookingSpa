import mongoose from 'mongoose';

const PayrollAdjustmentSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  bonuses: [{
    amount: { type: Number, default: 0 },
    reason: { type: String, default: '' },
  }],
  deductions: [{
    amount: { type: Number, default: 0 },
    type: { type: String, default: 'other' },
    reason: { type: String, default: '' },
  }],
  note: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'paid'], default: 'draft' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

PayrollAdjustmentSchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.PayrollAdjustment || mongoose.model('PayrollAdjustment', PayrollAdjustmentSchema);
