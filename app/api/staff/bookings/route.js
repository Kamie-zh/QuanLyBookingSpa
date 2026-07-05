import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireStaff } from '@/lib/auth';

// GET - List bookings assigned to current staff member
export async function GET(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();

    // Only return bookings assigned to this staff member (exclude cancelled ones for staff schedule view)
    const bookings = await Booking.find({
      staffId: user.userId,
      status: { $ne: 'cancelled' },
    })
    .populate('userId', 'fullName email phone memberType')
    .populate('services', 'serviceName serviceType price duration')
    .populate('estimatedBillId')
    .sort({ bookingDate: 1, startTime: 1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Staff bookings error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
