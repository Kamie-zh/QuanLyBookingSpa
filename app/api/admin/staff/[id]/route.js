import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

// PUT - Update a staff member account
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const staffMember = await User.findOne({ _id: id, role: 'staff' });
    if (!staffMember) {
      return NextResponse.json({ message: 'Không tìm thấy nhân viên' }, { status: 404 });
    }

    if (body.email && body.email !== staffMember.email) {
      const existing = await User.findOne({ email: body.email });
      if (existing) {
        return NextResponse.json({ message: 'Email này đã được sử dụng bởi người khác' }, { status: 400 });
      }
      staffMember.email = body.email;
    }

    if (body.fullName) staffMember.fullName = body.fullName;
    if (body.phone !== undefined) staffMember.phone = body.phone;
    if (body.password) {
      staffMember.password = await bcrypt.hash(body.password, 10);
    }

    await staffMember.save();

    return NextResponse.json({
      message: 'Cập nhật tài khoản nhân viên thành công',
      staff: {
        id: staffMember._id,
        fullName: staffMember.fullName,
        email: staffMember.email,
        phone: staffMember.phone,
        role: staffMember.role,
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE - Delete a staff member account
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const result = await User.deleteOne({ _id: id, role: 'staff' });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Không tìm thấy nhân viên hoặc tài khoản không phải staff' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Đã xoá tài khoản nhân viên thành công' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
