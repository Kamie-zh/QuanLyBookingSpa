import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin } from '@/lib/auth';

// GET - List all banners (admin)
export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const banners = await Banner.find().sort({ position: 1, sortOrder: 1 });
    return NextResponse.json({ banners });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// POST - Create banner
export async function POST(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const banner = await Banner.create(body);
    return NextResponse.json({ message: 'Tạo banner thành công', banner }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
