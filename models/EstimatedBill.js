import mongoose from 'mongoose';

const EstimatedBillSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  serviceItems: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String },
    price: { type: Number },
    duration: { type: Number },
  }],
  totalDuration: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  promotionTitle: { type: String, default: '' },
  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.EstimatedBill || mongoose.model('EstimatedBill', EstimatedBillSchema);
