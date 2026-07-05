import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, set to undefined if random
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  bookingDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // "09:00", "14:30"
  estimatedDuration: { type: Number, required: true }, // minutes
  bufferTime: { type: Number, default: 30 }, // minutes
  status: { type: String, enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'], default: 'pending' },
  estimatedBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'EstimatedBill' },
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  discountAmount: { type: Number, default: 0 },
  cancelledAt: { type: Date },
  confirmedAt: { type: Date },
  checkedInAt: { type: Date },
  completedAt: { type: Date },
  reminderSentAt: { type: Date },
  cancelReason: { type: String, default: '' },
  note: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
