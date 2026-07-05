import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true, trim: true },
  serviceType: { type: String, enum: ['spa', 'nail', 'makeup'], required: true },
  description: { type: String, default: '' },
  duration: { type: Number, required: true }, // minutes
  price: { type: Number, required: true },
  commissionRate: { type: Number, default: null },
  isCombo: { type: Boolean, default: false },
  comboServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  isActive: { type: Boolean, default: true },
  allowedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  imagePath: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
