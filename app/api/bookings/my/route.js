import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();

    const bookings = await Booking.find({ userId: user.userId })
      .populate('services', 'serviceName serviceType price duration imagePath imageUrl')
      .populate('staffId', 'fullName')
      .populate('estimatedBillId')
      .sort({ bookingDate: -1, createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('My bookings error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
