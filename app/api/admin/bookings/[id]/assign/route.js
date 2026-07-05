import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import StaffUnavailability from '@/models/StaffUnavailability';
import { requireAdmin } from '@/lib/auth';

function toMinutes(time = '00:00') {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { staffId } = await request.json();

    if (!staffId) {
      return NextResponse.json({ message: 'Vui lòng chọn nhân viên' }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy lịch hẹn' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ message: 'Không thể phân công nhân viên cho lịch hẹn đã huỷ' }, { status: 400 });
    }

    const staffMember = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staffMember) {
      return NextResponse.json({ message: 'Không tìm thấy nhân viên' }, { status: 404 });
    }

    // All staff can perform every service. Only time conflicts are checked.
    const isQualified = true;

    if (!isQualified) {
      return NextResponse.json({ message: 'Nhân viên này không hỗ trợ thực hiện tất cả dịch vụ trong lịch hẹn' }, { status: 400 });
    }

    // Check availability of this staff member for this booking's time slot
    const queryDate = new Date(booking.bookingDate);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const newStartMinutes = toMinutes(booking.startTime);
    const newEndMinutes = newStartMinutes + booking.estimatedDuration + booking.bufferTime;

    const unavailableItems = await StaffUnavailability.find({
      staffId,
      date: { $gte: queryDate, $lt: nextDay },
    });

    for (const item of unavailableItems) {
      const busyStart = toMinutes(item.startTime);
      const busyEnd = toMinutes(item.endTime);
      if (newStartMinutes < busyEnd && newEndMinutes > busyStart) {
        return NextResponse.json({
          message: `Nhân viên này đã báo bận/nghỉ từ ${item.startTime} đến ${item.endTime}. Lý do: ${item.reason || 'Không ghi rõ'}`,
        }, { status: 400 });
      }
    }

    const existingBookings = await Booking.find({
      _id: { $ne: booking._id }, // Exclude this booking itself
      bookingDate: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
      staffId: staffId,
    });

    for (const b of existingBookings) {
      const exStart = toMinutes(b.startTime);
      const exEnd = exStart + b.estimatedDuration + b.bufferTime;

      if (newStartMinutes < exEnd && newEndMinutes > exStart) {
        return NextResponse.json({ message: `Nhân viên này đã bị trùng lịch với mã booking #${b._id.toString().slice(-6)} từ ${b.startTime} (${b.estimatedDuration} phút)` }, { status: 400 });
      }
    }

    booking.staffId = staffId;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate('userId', 'fullName email phone memberType')
      .populate('staffId', 'fullName email phone')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    return NextResponse.json({
      message: 'Phân công nhân viên thành công',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
