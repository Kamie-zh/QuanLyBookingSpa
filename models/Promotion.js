import mongoose from 'mongoose';

const PromotionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percent', 'amount'], required: true },
  discountValue: { type: Number, required: true },
  targetMember: { type: String, enum: ['VIP', 'all'], default: 'all' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
