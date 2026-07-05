import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { sendEmail, bookingCancellationTemplate } from '@/lib/email';
import { hoursUntilVietnamDateTime } from '@/lib/vietnamTime';

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const booking = await Booking.findOne({ _id: id, userId: user.userId });
    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy lịch hẹn' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ message: 'Lịch hẹn đã được huỷ trước đó' }, { status: 400 });
    }

    // Customer can cancel online at least 24 hours before booking time.
    const diffHours = hoursUntilVietnamDateTime(booking.bookingDate, booking.startTime);

    if (diffHours < 24) {
      return NextResponse.json({ message: 'Chỉ được huỷ lịch online trước tối thiểu 24 giờ so với giờ hẹn' }, { status: 400 });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Send cancellation email (best-effort)
    try {
      const userData = await User.findById(user.userId);
      const dateStr = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
      await sendEmail({
        to: userData.email,
        subject: 'Huỷ lịch hẹn - Luxe Beauty Spa',
        html: bookingCancellationTemplate({
          fullName: userData.fullName,
          bookingDate: dateStr,
          startTime: booking.startTime,
        }),
        userId: user.userId,
        emailType: 'cancel',
      });
    } catch (emailErr) {
      console.error('Cancel email failed (best-effort):', emailErr);
    }

    return NextResponse.json({ message: 'Huỷ lịch hẹn thành công', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
