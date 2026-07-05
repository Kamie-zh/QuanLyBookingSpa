import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireStaff } from '@/lib/auth';

// PUT - Update booking status by staff
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { status, cancelReason } = await request.json();

    const booking = await Booking.findOne({ _id: id, staffId: user.userId });
    if (!booking) {
      return NextResponse.json({ message: 'Không tìm thấy lịch hẹn được phân công cho bạn' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ message: 'Lịch hẹn này đã bị huỷ trước đó' }, { status: 400 });
    }

    if (!['checked-in', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Trạng thái cập nhật không hợp lệ cho nhân viên' }, { status: 400 });
    }

    booking.status = status;
    if (status === 'checked-in') {
      booking.checkedInAt = new Date();
    } else if (status === 'completed') {
      booking.completedAt = new Date();
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelReason = cancelReason || 'Khách hàng không đến (Nhân viên báo cáo)';
    }

    await booking.save();

    const updated = await Booking.findById(id)
      .populate('userId', 'fullName email phone memberType')
      .populate('staffId', 'fullName email phone')
      .populate('services', 'serviceName serviceType price duration')
      .populate('estimatedBillId');

    return NextResponse.json({
      message: 'Cập nhật trạng thái thành công',
      booking: updated
    });
  } catch (error) {
    console.error('Staff update status error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
