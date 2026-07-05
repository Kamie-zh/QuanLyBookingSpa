import mongoose from 'mongoose';

const StaffUnavailabilitySchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, default: '08:00' },
  endTime: { type: String, default: '20:00' },
  fullDay: { type: Boolean, default: false },
  reason: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

StaffUnavailabilitySchema.index({ staffId: 1, date: 1 });

export default mongoose.models.StaffUnavailability || mongoose.model('StaffUnavailability', StaffUnavailabilitySchema);
