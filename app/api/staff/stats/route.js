import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireStaff } from '@/lib/auth';

// GET - Get staff member's daily revenue for the selected month/year
export async function GET(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || (now.getMonth() + 1));
    const year = parseInt(searchParams.get('year') || now.getFullYear());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch all completed bookings in the given month for this staff
    const bookings = await Booking.find({
      staffId: user.userId,
      bookingDate: { $gte: startDate, $lt: endDate },
      status: 'completed',
    }).populate('estimatedBillId');

    const completedBookings = await Booking.find({
      staffId: user.userId,
      bookingDate: { $gte: startDate, $lt: endDate },
      status: 'completed',
    })
      .populate('userId', 'fullName email phone memberType')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId')
      .sort({ bookingDate: -1, startTime: -1 });

    // Get number of days in that month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Initialize revenue map
    const dailyRevenueMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyRevenueMap[d] = 0;
    }

    // Accumulate total revenue per day
    bookings.forEach(b => {
      const bDate = new Date(b.bookingDate);
      const day = bDate.getDate();
      if (b.estimatedBillId) {
        dailyRevenueMap[day] += b.estimatedBillId.totalPrice || 0;
      }
    });

    // Convert to chart data format
    const chartData = Object.keys(dailyRevenueMap).map(day => ({
      day: parseInt(day),
      revenue: dailyRevenueMap[day],
    }));

    return NextResponse.json({
      month,
      year,
      chartData,
      completedBookings,
    });
  } catch (error) {
    console.error('Staff get stats error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
