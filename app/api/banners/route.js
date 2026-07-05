import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const type = searchParams.get('type');

    const filter = { isActive: true };
    if (position) filter.position = position;
    if (type && type !== 'all') filter.targetServiceType = { $in: [type, 'all'] };

    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Get banners error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
