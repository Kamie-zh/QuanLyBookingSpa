import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, bookingStatusUpdateTemplate } from '@/lib/email';

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { status } = await request.json();

    const booking = await Booking.findById(id)
      .populate('userId', 'fullName email')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy booking' }, { status: 404 });
    }

    // Status transition rules
    if (booking.status === 'cancelled' && (status === 'pending' || status === 'confirmed')) {
      return NextResponse.json({ message: 'Không thể chuyển trạng thái từ "Đã huỷ" sang trạng thái khác' }, { status: 400 });
    }

    if (!['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    booking.status = status;
    if (status === 'confirmed') booking.confirmedAt = new Date();
    if (status === 'cancelled') booking.cancelledAt = new Date();
    if (status === 'checked-in') booking.checkedInAt = new Date();
    if (status === 'completed') booking.completedAt = new Date();
    await booking.save();

    // Send status update email with full details (best-effort)
    let emailSent = false;
    try {
      const statusText = status === 'confirmed' ? 'Đã xác nhận' : status === 'cancelled' ? 'Đã huỷ' : status === 'checked-in' ? 'Khách đã đến' : status === 'completed' ? 'Đã hoàn thành' : 'Đang chờ';
      const dateStr = new Date(booking.bookingDate).toLocaleDateString('vi-VN');

      // Build service items for email
      const serviceItems = (booking.services || []).map(s => ({
        serviceName: s.serviceName,
        duration: s.duration,
        price: s.price,
      }));

      const result = await sendEmail({
        to: booking.userId.email,
        subject: `Cập nhật lịch hẹn - ${statusText} | Luxe Beauty Spa`,
        html: bookingStatusUpdateTemplate({
          fullName: booking.userId.fullName,
          bookingDate: dateStr,
          startTime: booking.startTime,
          statusText,
          services: booking.services?.map(s => s.serviceName).join(', '),
          totalPrice: booking.estimatedBillId?.totalPrice,
          totalDuration: booking.estimatedDuration,
          serviceItems,
        }),
        userId: booking.userId._id,
        emailType: 'status_update',
      });
      emailSent = result?.success || false;
    } catch (emailErr) {
      console.error('Status email failed:', emailErr);
    }

    // Re-populate for complete response
    const updatedBooking = await Booking.findById(id)
      .populate('userId', 'fullName email phone memberType')
      .populate('staffId', 'fullName email phone')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    return NextResponse.json({ message: 'Cập nhật trạng thái thành công', booking: updatedBooking, emailSent });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
