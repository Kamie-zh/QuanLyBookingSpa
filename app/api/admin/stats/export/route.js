import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';
import { buildExcelXml, excelResponse, formatCurrency, formatDate } from '@/lib/excelExport';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(searchParams) {
  const now = new Date();
  const today = startOfDay(now);
  const range = searchParams.get('range') || 'today';

  if (range === 'custom') {
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const startDate = startParam ? startOfDay(new Date(startParam)) : today;
    const endDate = endParam ? addDays(startOfDay(new Date(endParam)), 1) : addDays(today, 1);
    return { range, startDate, endDate };
  }
  if (range === 'yesterday') return { range, startDate: addDays(today, -1), endDate: today };

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisWeekStart = addDays(today, mondayOffset);
  if (range === 'thisWeek') return { range, startDate: thisWeekStart, endDate: addDays(thisWeekStart, 7) };
  if (range === 'lastWeek') return { range, startDate: addDays(thisWeekStart, -7), endDate: thisWeekStart };
  if (range === 'thisMonth') return { range, startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
  if (range === 'lastMonth') return { range, startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1), endDate: new Date(today.getFullYear(), today.getMonth(), 1) };

  return { range: 'today', startDate: today, endDate: addDays(today, 1) };
}

function normalizeView(view) {
  return ['staff', 'service', 'customer', 'time', 'invoice'].includes(view) ? view : 'staff';
}

function rangeText(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(addDays(endDate, -1))}`;
}

function buildStaffRows(bookings, allStaff) {
  return allStaff
    .map(staff => {
      const items = bookings.filter(booking => booking.staffId?._id?.toString() === staff._id.toString());
      return [
        staff.fullName,
        staff.email,
        items.length,
        formatCurrency(items.reduce((sum, booking) => sum + (booking.estimatedBillId?.totalPrice || 0), 0)),
      ];
    })
    .sort((a, b) => b[3] - a[3]);
}

function buildServiceRows(bookings) {
  const map = new Map();
  bookings.forEach(booking => {
    booking.services?.forEach(service => {
      const id = service._id.toString();
      const current = map.get(id) || {
        serviceName: service.serviceName,
        serviceType: service.serviceType,
        price: service.price || 0,
        bookingCount: 0,
        estimatedRevenue: 0,
      };
      current.bookingCount += 1;
      current.estimatedRevenue += service.price || 0;
      map.set(id, current);
    });
  });
  return [...map.values()]
    .sort((a, b) => b.bookingCount - a.bookingCount || b.estimatedRevenue - a.estimatedRevenue)
    .map((item, index) => [index + 1, item.serviceName, item.serviceType, item.bookingCount, formatCurrency(item.price), formatCurrency(item.estimatedRevenue)]);
}

function buildCustomerRows(bookings) {
  const map = new Map();
  bookings.forEach(booking => {
    const customer = booking.userId;
    if (!customer) return;
    const id = customer._id.toString();
    const current = map.get(id) || {
      customerName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      memberType: customer.memberType,
      invoiceCount: 0,
      revenue: 0,
    };
    current.invoiceCount += 1;
    current.revenue += booking.estimatedBillId?.totalPrice || 0;
    map.set(id, current);
  });
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue || b.invoiceCount - a.invoiceCount)
    .map((item, index) => [index + 1, item.customerName, item.email, item.phone, item.memberType, item.invoiceCount, formatCurrency(item.revenue)]);
}

function buildTimeRows(bookings) {
  const map = new Map();
  bookings.forEach(booking => {
    const key = booking.bookingDate.toISOString().slice(0, 10);
    const current = map.get(key) || { invoiceCount: 0, revenue: 0 };
    current.invoiceCount += 1;
    current.revenue += booking.estimatedBillId?.totalPrice || 0;
    map.set(key, current);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, item]) => [formatDate(date), item.invoiceCount, formatCurrency(item.revenue)]);
}

function buildInvoiceRows(bookings) {
  return [...bookings]
    .sort((a, b) => (b.estimatedBillId?.totalPrice || 0) - (a.estimatedBillId?.totalPrice || 0))
    .map((booking, index) => [
      index + 1,
      formatDate(booking.bookingDate),
      booking.startTime,
      booking.userId?.fullName || '',
      booking.staffId?.fullName || '',
      booking.services?.map(service => service.serviceName).join(', '),
      formatCurrency(booking.estimatedBillId?.totalPrice),
      booking._id.toString(),
    ]);
}

async function buildStatsExcel(request) {
    const { searchParams } = new URL(request.url);
    const view = normalizeView(searchParams.get('view'));
    const { range, startDate, endDate } = getDateRange(searchParams);
    const period = { bookingDate: { $gte: startDate, $lt: endDate } };

    const [completedBookings, serviceBookings, allStaff] = await Promise.all([
      Booking.find({ ...period, status: 'completed' })
        .populate('userId', 'fullName email phone memberType')
        .populate('staffId', 'fullName email')
        .populate('services', 'serviceName serviceType price')
        .populate('estimatedBillId')
        .sort({ bookingDate: 1, startTime: 1 }),
      Booking.find({ ...period, status: { $ne: 'cancelled' } })
        .populate('services', 'serviceName serviceType price'),
      User.find({ role: 'staff' }).select('fullName email'),
    ]);

    const titleMap = {
      staff: 'Thong ke theo nhan vien',
      service: 'Thong ke theo dich vu',
      customer: 'Thong ke theo khach hang',
      time: 'Thong ke theo thoi gian',
      invoice: 'Thong ke theo hoa don',
    };
    const sheetMap = {
      staff: {
        name: 'Nhan vien',
        headers: ['Nhan vien', 'Email', 'Don hoan thanh', 'Doanh thu'],
        rows: buildStaffRows(completedBookings, allStaff),
      },
      service: {
        name: 'Dich vu',
        headers: ['#', 'Dich vu', 'Loai', 'So lan khach chon', 'Gia dich vu', 'Doanh thu uoc tinh'],
        rows: buildServiceRows(serviceBookings),
      },
      customer: {
        name: 'Khach hang',
        headers: ['#', 'Khach hang', 'Email', 'SDT', 'Hang', 'So hoa don', 'Tong chi tieu'],
        rows: buildCustomerRows(completedBookings),
      },
      time: {
        name: 'Thoi gian',
        headers: ['Ngay', 'So hoa don', 'Doanh thu'],
        rows: buildTimeRows(completedBookings),
      },
      invoice: {
        name: 'Hoa don',
        headers: ['#', 'Ngay', 'Gio', 'Khach hang', 'Nhan vien', 'Dich vu', 'Doanh thu', 'Booking ID'],
        rows: buildInvoiceRows(completedBookings),
      },
    };

    const sheet = sheetMap[view];
    const filename = `bao-cao-${view}-${range}-${startDate.toISOString().slice(0, 10)}.xls`;
    const xml = buildExcelXml({
      title: `${titleMap[view]} ${rangeText(startDate, endDate)}`,
      sheets: [
        {
          ...sheet,
          title: titleMap[view],
          subtitle: `Khoang thoi gian: ${rangeText(startDate, endDate)} | Ngay xuat: ${new Date().toLocaleString('vi-VN')}`,
        },
      ],
    });

    return { xml, filename, title: titleMap[view], rangeLabel: rangeText(startDate, endDate) };
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { xml, filename } = await buildStatsExcel(request);
    return excelResponse(xml, filename);
  } catch (error) {
    console.error('Admin export stats error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ message: 'Vui long nhap email nhan bao cao' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Email khong hop le' }, { status: 400 });
    }

    const { xml, filename, title, rangeLabel } = await buildStatsExcel(request);
    const result = await sendEmail({
      to: email,
      subject: `Bao cao thong ke Luxe Beauty Spa - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #2D2A26;">
          <h2 style="color:#8B6F47;">Bao cao thong ke Luxe Beauty Spa</h2>
          <p>File Excel bao cao duoc dinh kem trong email nay.</p>
          <p><strong>Loai thong ke:</strong> ${title}</p>
          <p><strong>Khoang thoi gian:</strong> ${rangeLabel}</p>
        </div>
      `,
      userId: user.userId,
      emailType: 'stats_export',
      attachments: [
        {
          filename,
          content: Buffer.from(xml, 'utf8'),
          contentType: 'application/vnd.ms-excel; charset=utf-8',
        },
      ],
    });

    if (!result.success) {
      return NextResponse.json({ message: result.error || 'Gui email that bai' }, { status: 500 });
    }

    return NextResponse.json({ message: `Da gui file Excel toi ${email}` });
  } catch (error) {
    console.error('Admin email stats export error:', error);
    return NextResponse.json({ message: error.message || 'Loi server' }, { status: 500 });
  }
}
