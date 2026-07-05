import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Thiếu thông tin yêu cầu' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Mật khẩu phải từ 6 ký tự trở lên' }, { status: 400 });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return NextResponse.json({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' }, { status: 400 });
    }

    // Hash new password and clear token
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
