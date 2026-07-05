import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { requireAdmin } from '@/lib/auth';

// GET - List all promotions
export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    return NextResponse.json({ promotions });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// POST - Create promotion
export async function POST(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const promotion = await Promotion.create(body);
    return NextResponse.json({ message: 'Tạo khuyến mãi thành công', promotion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
