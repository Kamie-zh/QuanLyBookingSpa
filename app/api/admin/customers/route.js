import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Booking from '@/models/Booking';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const memberType = searchParams.get('memberType');

    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (memberType) filter.memberType = memberType;

    const customers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    const customersWithStylist = await Promise.all(customers.map(async (c) => {
      const bookingsGrouped = await Booking.aggregate([
        { $match: { userId: c._id, staffId: { $exists: true, $ne: null } } },
        { $group: { _id: '$staffId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staffInfo'
          }
        },
        { $unwind: { path: '$staffInfo', preserveNullAndEmptyArrays: true } }
      ]);

      const preferredStaff = bookingsGrouped[0]?.staffInfo?.fullName || 'Không có';
      
      return {
        ...c.toObject(),
        preferredStaff
      };
    }));

    return NextResponse.json({ customers: customersWithStylist });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

