import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StaffUnavailability from '@/models/StaffUnavailability';
import '@/models/User';
import { requireAdmin } from '@/lib/auth';
import { getVietnamDayRange } from '@/lib/vietnamTime';

function normalizeDate(value) {
  return getVietnamDayRange(value).start;
}

export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = normalizeDate(from);
      if (to) {
        filter.date.$lt = getVietnamDayRange(to).end;
      }
    }

    const unavailability = await StaffUnavailability.find(filter)
      .populate('staffId', 'fullName email phone')
      .sort({ date: 1, startTime: 1 });

    return NextResponse.json({ unavailability });
  } catch (error) {
    console.error('Admin staff unavailability get error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
