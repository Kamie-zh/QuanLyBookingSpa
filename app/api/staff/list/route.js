import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const staff = await User.find({ role: 'staff' })
      .select('fullName')
      .sort({ fullName: 1 });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get public staff list error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
