import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PayrollAdjustment from '@/models/PayrollAdjustment';
import { requireAdmin } from '@/lib/auth';
import { buildPayrollRows, normalizePayrollPeriod } from '@/lib/payroll';

function sanitizeBonuses(items = []) {
  return items
    .map(item => ({ amount: Math.max(0, Number(item.amount || 0)), reason: item.reason || '' }))
    .filter(item => item.amount > 0 || item.reason.trim());
}

function sanitizeDeductions(items = []) {
  return items
    .map(item => ({
      amount: Math.max(0, Number(item.amount || 0)),
      type: item.type || 'other',
      reason: item.reason || '',
    }))
    .filter(item => item.amount > 0 || item.reason.trim());
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const { month, year } = normalizePayrollPeriod(searchParams);
    const payroll = await buildPayrollRows({ month, year });
    return NextResponse.json({ month, year, payroll });
  } catch (error) {
    console.error('Admin payroll get error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const body = await request.json();
    const { staffId, month, year } = body;
    if (!staffId || !month || !year) {
      return NextResponse.json({ message: 'Thieu thong tin bang luong' }, { status: 400 });
    }

    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return NextResponse.json({ message: 'Khong tim thay nhan vien' }, { status: 404 });
    }

    const periodFilter = { staffId, month: Number(month), year: Number(year) };
    const existingAdjustment = await PayrollAdjustment.findOne(periodFilter);
    if (existingAdjustment?.status === 'paid') {
      return NextResponse.json({ message: 'Bảng lương đã trả, không thể chỉnh sửa' }, { status: 400 });
    }

    const userPatch = {};
    if (body.baseSalary !== undefined) userPatch.baseSalary = Math.max(0, Number(body.baseSalary || 0));
    if (body.commissionRate !== undefined) userPatch.commissionRate = Math.min(Math.max(Number(body.commissionRate || 0), 0), 100);
    if (Object.keys(userPatch).length) {
      userPatch.updatedAt = new Date();
      await User.collection.updateOne({ _id: staff._id, role: 'staff' }, { $set: userPatch });
    }

    const bonuses = sanitizeBonuses(body.bonuses);
    const deductions = sanitizeDeductions(body.deductions);
    const status = body.status === 'paid' ? 'paid' : 'draft';

    await PayrollAdjustment.findOneAndUpdate(
      periodFilter,
      {
        $set: {
          bonuses,
          deductions,
          bonus: bonuses.reduce((sum, item) => sum + item.amount, 0),
          penalty: deductions.reduce((sum, item) => sum + item.amount, 0),
          note: body.note || '',
          status,
          updatedBy: user.userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const payroll = await buildPayrollRows({ month: Number(month), year: Number(year) });
    return NextResponse.json({ message: 'Đã cập nhật bảng lương', payroll });
  } catch (error) {
    console.error('Admin payroll update error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
