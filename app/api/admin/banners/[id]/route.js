import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const banner = await Banner.findByIdAndUpdate(id, body, { new: true });
    if (!banner) return NextResponse.json({ message: 'Không tìm thấy banner' }, { status: 404 });

    return NextResponse.json({ message: 'Cập nhật banner thành công', banner });
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

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) return NextResponse.json({ message: 'Không tìm thấy banner' }, { status: 404 });

    return NextResponse.json({ message: 'Xoá banner thành công' });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
