import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { requireAdmin } from '@/lib/auth';

// PUT - Update service
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const payload = { ...body, allowedStaff: [] };

    const service = await Service.findByIdAndUpdate(id, payload, { new: true });
    if (!service) {
      return NextResponse.json({ message: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cập nhật dịch vụ thành công', service });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE - Delete service
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json({ message: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xoá dịch vụ thành công' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
