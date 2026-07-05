import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function PUT(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { oldPassword, newPassword, confirmPassword } = await request.json();

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'Please fill in all required fields' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }
    if (oldPassword === newPassword) {
      return NextResponse.json({ message: 'New password must be different from old password' }, { status: 400 });
    }

    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const isCurrentPassword = await bcrypt.compare(oldPassword, currentUser.password);
    if (!isCurrentPassword) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    currentUser.password = await bcrypt.hash(newPassword, 10);
    await currentUser.save();

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
