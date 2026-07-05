import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Booking from '@/models/Booking';
import { requireAuth } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toClientUser(user, totalBookings) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    memberType: user.memberType,
    totalBookings: user.totalBookings ?? totalBookings ?? 0,
    totalEstimatedAmount: user.totalEstimatedAmount || 0,
  };
}

export async function GET(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const currentUser = await User.findById(user.userId).select('-password');
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const actualBookings = await Booking.countDocuments({ userId: currentUser._id });

    return NextResponse.json({ user: toClientUser(currentUser, actualBookings) });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { fullName, email, phone } = await request.json();
    const updates = {};

    if (typeof fullName === 'string' && fullName.trim()) {
      updates.fullName = fullName.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_RE.test(normalizedEmail)) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
      }

      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user.userId } });
      if (existing) {
        return NextResponse.json({ message: 'Email is already taken!' }, { status: 409 });
      }
      updates.email = normalizedEmail;
    }
    if (typeof phone === 'string' && phone.trim()) {
      updates.phone = phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Please provide at least one field to update' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(user.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: toClientUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Invalid profile information' }, { status: 400 });
  }
}
