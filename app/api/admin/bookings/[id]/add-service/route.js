import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import EstimatedBill from '@/models/EstimatedBill';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { serviceId } = await request.json();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy booking' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ message: 'Không thể thêm dịch vụ cho booking đã huỷ' }, { status: 400 });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ message: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    // Check for duplicate service
    const alreadyHas = booking.services.some(s => s.toString() === serviceId);
    if (alreadyHas) {
      return NextResponse.json({ message: 'Dịch vụ này đã có trong lịch hẹn' }, { status: 400 });
    }

    // If staff is assigned, check if the increased duration conflicts with other bookings
    if (booking.staffId) {
      const queryDate = new Date(booking.bookingDate);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const [startH, startM] = booking.startTime.split(':').map(Number);
      const newStartMinutes = startH * 60 + startM;
      const newEndMinutes = newStartMinutes + booking.estimatedDuration + service.duration + booking.bufferTime;

      const otherBookings = await Booking.find({
        _id: { $ne: booking._id },
        bookingDate: { $gte: queryDate, $lt: nextDay },
        status: { $ne: 'cancelled' },
        staffId: booking.staffId,
      });

      for (const ob of otherBookings) {
        const [obH, obM] = ob.startTime.split(':').map(Number);
        const obStart = obH * 60 + obM;
        const obEnd = obStart + ob.estimatedDuration + ob.bufferTime;

        if (newStartMinutes < obEnd && newEndMinutes > obStart) {
          return NextResponse.json({
            message: `Không thể thêm dịch vụ. Sau khi tăng thời lượng, nhân viên bị trùng lịch với booking #${ob._id.toString().slice(-6)} vào lúc ${ob.startTime}`
          }, { status: 400 });
        }
      }
    }

    // Add service to booking
    booking.services.push(serviceId);
    booking.estimatedDuration += service.duration;
    await booking.save();

    // Update bill
    if (booking.estimatedBillId) {
      const bill = await EstimatedBill.findById(booking.estimatedBillId);
      if (bill) {
        bill.serviceItems.push({
          serviceId: service._id,
          serviceName: service.serviceName,
          price: service.price,
          duration: service.duration,
        });
        bill.totalDuration += service.duration;
        bill.totalPrice += service.price;
        bill.updatedBy = user.userId;
        await bill.save();
      }
    }

    const updatedBooking = await Booking.findById(id)
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    return NextResponse.json({
      message: 'Thêm dịch vụ phát sinh thành công',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Add extra service error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
