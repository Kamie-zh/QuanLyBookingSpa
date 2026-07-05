import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import StaffUnavailability from '@/models/StaffUnavailability';
import { requireAuth } from '@/lib/auth';
import { getVietnamDayRange, hoursUntilVietnamDateTime } from '@/lib/vietnamTime';

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { bookingDate, startTime } = await request.json();

    if (!bookingDate || !startTime) {
      return NextResponse.json({ message: 'Vui long chon ngay va gio moi' }, { status: 400 });
    }

    const booking = await Booking.findOne({ _id: id, userId: user.userId });
    if (!booking) {
      return NextResponse.json({ message: 'Khong tim thay lich hen cua ban' }, { status: 404 });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ message: 'Chi duoc sua lich dang cho xac nhan hoac da xac nhan' }, { status: 400 });
    }

    if (hoursUntilVietnamDateTime(booking.bookingDate, booking.startTime) < 24) {
      return NextResponse.json({ message: 'Chi duoc sua lich truoc gio hen toi thieu 24 gio' }, { status: 400 });
    }

    const { start: queryDate, end: nextDay } = getVietnamDayRange(bookingDate);

    const newStart = toMinutes(startTime);
    const newEnd = newStart + booking.estimatedDuration + booking.bufferTime;
    if (newStart < 8 * 60 || newEnd > 20 * 60) {
      return NextResponse.json({ message: 'Gio hen phai nam trong khung 08:00 - 20:00 va du thoi luong dich vu' }, { status: 400 });
    }

    if (hoursUntilVietnamDateTime(bookingDate, startTime) < 24) {
      return NextResponse.json({ message: 'Gio hen moi phai cach hien tai toi thieu 24 gio' }, { status: 400 });
    }

    const allStaff = await User.find({ role: 'staff' });
    const qualifiedStaff = [...allStaff];

    const existingBookings = await Booking.find({
      _id: { $ne: booking._id },
      bookingDate: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    });
    const unavailableItems = await StaffUnavailability.find({
      date: { $gte: queryDate, $lt: nextDay },
    });

    const overlaps = existingBookings.filter(item => {
      const exStart = toMinutes(item.startTime);
      const exEnd = exStart + item.estimatedDuration + item.bufferTime;
      return newStart < exEnd && newEnd > exStart;
    });

    if (booking.staffId) {
      const staffBusy = overlaps.some(item => item.staffId?.toString() === booking.staffId.toString());
      if (staffBusy) {
        return NextResponse.json({ message: 'Nhan vien hien tai da ban trong khung gio moi' }, { status: 400 });
      }
      const staffUnavailable = unavailableItems.some(item => (
        item.staffId.toString() === booking.staffId.toString()
        && newStart < toMinutes(item.endTime)
        && newEnd > toMinutes(item.startTime)
      ));
      if (staffUnavailable) {
        return NextResponse.json({ message: 'Nhan vien hien tai da bao ban/nghi trong khung gio moi' }, { status: 400 });
      }
    } else {
      const freeQualifiedStaff = qualifiedStaff.filter(staff => {
        const hasBooking = overlaps.some(item => item.staffId?.toString() === staff._id.toString());
        const unavailable = unavailableItems.some(item => (
          item.staffId.toString() === staff._id.toString()
          && newStart < toMinutes(item.endTime)
          && newEnd > toMinutes(item.startTime)
        ));
        return !hasBooking && !unavailable;
      });
      const randomBookings = overlaps.filter(item => !item.staffId);
      if (randomBookings.length >= freeQualifiedStaff.length) {
        return NextResponse.json({ message: 'Khung gio moi da het nhan vien phu hop' }, { status: 400 });
      }
    }

    booking.bookingDate = queryDate;
    booking.startTime = startTime;
    booking.status = 'pending';
    booking.confirmedAt = undefined;
    booking.reminderSentAt = undefined;
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('services', 'serviceName serviceType price duration imagePath imageUrl')
      .populate('staffId', 'fullName')
      .populate('estimatedBillId');

    return NextResponse.json({
      message: 'Da cap nhat ngay gio lich hen. Lich da chuyen ve trang thai cho admin xac nhan lai.',
      booking: updated
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
