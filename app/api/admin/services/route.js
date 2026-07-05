import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { requireAdmin } from '@/lib/auth';

// POST - Create service
export async function POST(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const payload = { ...body, allowedStaff: [] };

    const service = await Service.create(payload);
    return NextResponse.json({ message: 'Tạo dịch vụ thành công', service }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// GET - List all services (admin)
export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const services = await Service.find()
      .populate('comboServices', 'serviceName price duration')
      .sort({ createdAt: -1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Admin get services error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
