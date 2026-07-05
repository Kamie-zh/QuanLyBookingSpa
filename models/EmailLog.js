import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emailType: { type: String, enum: ['booking', 'cancel', 'vip', 'promotion', 'status_update', 'auto_confirm', 'booking_reminder', 'reset_password', 'stats_export'], required: true },
  subject: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], required: true },
}, { timestamps: true });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);
