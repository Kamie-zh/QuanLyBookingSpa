import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'staff'], default: 'user' },
  memberType: { type: String, enum: ['normal', 'VIP'], default: 'normal' },
  baseSalary: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 10 },
  totalBookings: { type: Number, default: 0 },
  totalEstimatedAmount: { type: Number, default: 0 },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
