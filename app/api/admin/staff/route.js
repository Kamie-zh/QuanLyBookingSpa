import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

// GET - List all staff members
export async function GET(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get staff list error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// POST - Create a new staff account
export async function POST(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { fullName, email, password, phone } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email này đã được sử dụng' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'staff',
    });

    return NextResponse.json({
      message: 'Tạo tài khoản nhân viên thành công',
      staff: {
        id: newStaff._id,
        fullName: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
