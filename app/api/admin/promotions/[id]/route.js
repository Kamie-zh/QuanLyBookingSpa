import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const promotion = await Promotion.findByIdAndUpdate(id, body, { new: true });
    if (!promotion) return NextResponse.json({ message: 'Không tìm thấy khuyến mãi' }, { status: 404 });

    return NextResponse.json({ message: 'Cập nhật khuyến mãi thành công', promotion });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const promotion = await Promotion.findByIdAndDelete(id);
    if (!promotion) return NextResponse.json({ message: 'Không tìm thấy khuyến mãi' }, { status: 404 });

    return NextResponse.json({ message: 'Xoá khuyến mãi thành công' });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
