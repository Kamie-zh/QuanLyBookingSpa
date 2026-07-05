import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StaffUnavailability from '@/models/StaffUnavailability';
import { requireStaff } from '@/lib/auth';
import { getVietnamDayRange } from '@/lib/vietnamTime';

function normalizeDate(value) {
  return getVietnamDayRange(value).start;
}

function toMinutes(time = '00:00') {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export async function GET(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const today = normalizeDate(new Date());
    const items = await StaffUnavailability.find({
      staffId: user.userId,
      date: { $gte: today },
    }).sort({ date: 1, startTime: 1 });

    return NextResponse.json({ unavailability: items });
  } catch (error) {
    console.error('Staff unavailability get error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const { date, startTime, endTime, fullDay, reason } = await request.json();

    if (!date) {
      return NextResponse.json({ message: 'Vui long chon ngay' }, { status: 400 });
    }

    const normalizedDate = normalizeDate(date);
    const finalStart = fullDay ? '08:00' : startTime;
    const finalEnd = fullDay ? '20:00' : endTime;

    if (!finalStart || !finalEnd || toMinutes(finalStart) >= toMinutes(finalEnd)) {
      return NextResponse.json({ message: 'Khung gio ban khong hop le' }, { status: 400 });
    }

    const item = await StaffUnavailability.create({
      staffId: user.userId,
      date: normalizedDate,
      startTime: finalStart,
      endTime: finalEnd,
      fullDay: Boolean(fullDay),
      reason: reason || '',
      createdBy: user.userId,
    });

    return NextResponse.json({ message: 'Da ghi nhan lich ban/nghi', unavailability: item }, { status: 201 });
  } catch (error) {
    console.error('Staff unavailability post error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
