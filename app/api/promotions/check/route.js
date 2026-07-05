import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { requireAuth } from '@/lib/auth';

// POST - Check/validate promo code
export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { code, memberType } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Vui lòng nhập mã khuyến mãi' }, { status: 400 });
    }

    const now = new Date();

    // Find promotion by title (case-insensitive) that is active and within date range
    const promotion = await Promotion.findOne({
      title: { $regex: new RegExp(`^${code.trim()}$`, 'i') },
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promotion) {
      return NextResponse.json({ message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' }, { status: 404 });
    }

    // Check target member
    if (promotion.targetMember === 'VIP' && memberType !== 'VIP') {
      return NextResponse.json({ message: 'Mã khuyến mãi này chỉ dành cho khách VIP' }, { status: 403 });
    }

    return NextResponse.json({
      promotion: {
        _id: promotion._id,
        title: promotion.title,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        description: promotion.description,
      }
    });
  } catch (error) {
    console.error('Check promotion error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
