import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.bookingDate = { $gte: queryDate, $lt: nextDay };
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'fullName email phone memberType')
      .populate('staffId', 'fullName email phone')
      .populate('services', 'serviceName serviceType price duration allowedStaff')
      .populate('estimatedBillId')
      .sort({ bookingDate: -1, createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Admin get bookings error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
