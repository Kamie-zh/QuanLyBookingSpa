import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { requireStaff } from '@/lib/auth';
import { buildExcelXml, excelResponse, formatCurrency, formatDate } from '@/lib/excelExport';

export async function GET(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || (now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || now.getFullYear(), 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const bookings = await Booking.find({
      staffId: user.userId,
      bookingDate: { $gte: startDate, $lt: endDate },
      status: 'completed',
    })
      .populate('userId', 'fullName email phone')
      .populate('staffId', 'fullName email')
      .populate('services', 'serviceName')
      .populate('estimatedBillId')
      .sort({ bookingDate: 1, startTime: 1 });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.estimatedBillId?.totalPrice || 0), 0);
    const rows = bookings.map((booking) => [
      formatDate(booking.bookingDate),
      booking.startTime,
      booking.userId?.fullName || '',
      booking.userId?.phone || '',
      booking.services?.map(s => s.serviceName).join(', '),
      formatCurrency(booking.estimatedBillId?.totalPrice),
      booking._id.toString(),
    ]);

    const xml = buildExcelXml({
      title: `Bao cao doanh thu nhan vien ${month}-${year}`,
      sheets: [{
        name: 'Doanh thu ca nhan',
        title: `Báo cáo doanh thu cá nhân - ${month}/${year}`,
        subtitle: `Tổng đơn: ${bookings.length} | Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')}đ`,
        headers: ['Ngày', 'Giờ', 'Khách hàng', 'SĐT', 'Dịch vụ', 'Doanh thu', 'Booking ID'],
        rows,
      }],
    });

    return excelResponse(xml, `bao-cao-doanh-thu-ca-nhan-${month}-${year}.xls`);
  } catch (error) {
    console.error('Staff export stats error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
