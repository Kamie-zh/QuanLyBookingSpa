import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id)
      .populate('comboServices', 'serviceName price duration description');

    if (!service) {
      return NextResponse.json({ message: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Get service detail error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
