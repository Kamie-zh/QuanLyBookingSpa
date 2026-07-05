import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const q = searchParams.get('q')?.trim();

    const filter = { isActive: true };
    if (type && type !== 'all') {
      filter.serviceType = type;
    }
    if (q) {
      filter.$or = [
        { serviceName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { serviceType: { $regex: q, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .populate('comboServices', 'serviceName price duration')
      .populate('allowedStaff', 'fullName email phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
