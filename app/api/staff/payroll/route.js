import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireStaff } from '@/lib/auth';
import { buildPayrollRows, normalizePayrollPeriod } from '@/lib/payroll';

export async function GET(request) {
  try {
    const { user, error } = await requireStaff(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const { month, year } = normalizePayrollPeriod(searchParams);
    const payroll = await buildPayrollRows({ month, year, staffId: user.userId });
    return NextResponse.json({ month, year, payroll: payroll[0] || null });
  } catch (error) {
    console.error('Staff payroll get error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
