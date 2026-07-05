import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid customer id' }, { status: 400 });
    }

    const customer = await User.findById(id).select('totalBookings totalEstimatedAmount');
    const customerId = new mongoose.Types.ObjectId(id);

    const bookings = await Booking.find({ userId: customerId })
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId')
      .sort({ bookingDate: -1 });

    return NextResponse.json({
      bookings,
      summary: {
        storedTotalBookings: customer?.totalBookings || 0,
        storedTotalEstimatedAmount: customer?.totalEstimatedAmount || 0,
        actualBookingRecords: bookings.length,
      },
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
