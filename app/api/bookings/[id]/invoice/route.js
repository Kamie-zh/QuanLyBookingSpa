import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate('userId', 'fullName email phone memberType')
      .populate('staffId', 'fullName email')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy booking' }, { status: 404 });
    }
    if (booking.status !== 'completed') {
      return NextResponse.json({ message: 'Chỉ xem hóa đơn cho booking đã hoàn thành' }, { status: 400 });
    }

    const isOwner = booking.userId?._id?.toString() === user.userId?.toString();
    const isAssignedStaff = booking.staffId?._id?.toString() === user.userId?.toString();
    if (user.role !== 'admin' && !isAssignedStaff && !isOwner) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const bill = booking.estimatedBillId;
    const services = (bill?.serviceItems?.length ? bill.serviceItems : booking.services).map((service) => ({
      serviceName: service.serviceName,
      serviceType: service.serviceType || '',
      duration: service.duration || 0,
      price: service.price || 0,
    }));

    return NextResponse.json({
      invoice: {
        bookingId: booking._id,
        customer: {
          fullName: booking.userId?.fullName || '',
          email: booking.userId?.email || '',
          phone: booking.userId?.phone || '',
          memberType: booking.userId?.memberType || '',
        },
        staff: {
          fullName: booking.staffId?.fullName || '',
          email: booking.staffId?.email || '',
        },
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        completedAt: booking.completedAt,
        status: booking.status,
        services,
        totalDuration: bill?.totalDuration || booking.estimatedDuration || 0,
        discountAmount: bill?.discountAmount || booking.discountAmount || 0,
        promotionTitle: bill?.promotionTitle || '',
        totalPrice: bill?.totalPrice || 0,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
