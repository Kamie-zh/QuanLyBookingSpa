import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import { sendEmail, bookingStatusUpdateTemplate } from '@/lib/email';

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || 'spa-cron-secret-2024';

export async function GET(request) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();

    // Get all pending bookings
    const pendingBookings = await Booking.find({ status: 'pending' })
      .populate('userId', 'fullName email')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    let autoConfirmedCount = 0;
    const errors = [];

    for (const booking of pendingBookings) {
      try {
        // Calculate exact booking datetime
        const [startH, startM] = booking.startTime.split(':').map(Number);
        const bookingDateTime = new Date(booking.bookingDate);
        bookingDateTime.setHours(startH, startM, 0, 0);

        // Auto-confirm if booking is within 12 hours
        const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
        if (hoursUntilBooking > 0 && hoursUntilBooking <= 12) {
          booking.status = 'confirmed';
          booking.confirmedAt = new Date();
          await booking.save();
          autoConfirmedCount++;

          // Send confirmation email
          try {
            const dateStr = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
            const serviceItems = (booking.services || []).map(s => ({
              serviceName: s.serviceName,
              duration: s.duration,
              price: s.price,
            }));

            await sendEmail({
              to: booking.userId.email,
              subject: 'Xác nhận lịch hẹn (tự động) - Luxe Beauty Spa',
              html: bookingStatusUpdateTemplate({
                fullName: booking.userId.fullName,
                bookingDate: dateStr,
                startTime: booking.startTime,
                statusText: 'Đã xác nhận',
                services: booking.services?.map(s => s.serviceName).join(', '),
                totalPrice: booking.estimatedBillId?.totalPrice,
                totalDuration: booking.estimatedDuration,
                serviceItems,
              }),
              userId: booking.userId._id,
              emailType: 'auto_confirm',
            });
          } catch (emailErr) {
            console.error(`Auto-confirm email failed for booking ${booking._id}:`, emailErr);
          }
        }
      } catch (err) {
        errors.push({ bookingId: booking._id, error: err.message });
      }
    }

    return NextResponse.json({
      message: `Auto-confirm completed: ${autoConfirmedCount} bookings confirmed`,
      autoConfirmedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Auto-confirm cron error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
