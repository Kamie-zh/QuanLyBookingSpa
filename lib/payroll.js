import Booking from '@/models/Booking';
import User from '@/models/User';
import PayrollAdjustment from '@/models/PayrollAdjustment';
import '@/models/EstimatedBill';
import { getVietnamDayRange } from '@/lib/vietnamTime';
import mongoose from 'mongoose';

export function getPayrollMonthRange(month, year) {
  const mm = String(month).padStart(2, '0');
  const start = getVietnamDayRange(`${year}-${mm}-01`).start;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = getVietnamDayRange(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01`).start;
  return { start, end };
}

export function normalizePayrollPeriod(searchParams) {
  const now = new Date();
  const month = Number(searchParams.get('month') || now.getMonth() + 1);
  const year = Number(searchParams.get('year') || now.getFullYear());
  return {
    month: Math.min(Math.max(month || 1, 1), 12),
    year: year || now.getFullYear(),
  };
}

export async function buildPayrollRows({ month, year, staffId }) {
  const { start, end } = getPayrollMonthRange(month, year);
  const staffObjectId = staffId ? new mongoose.Types.ObjectId(staffId) : null;
  const staffFilter = staffObjectId ? { _id: staffObjectId, role: 'staff' } : { role: 'staff' };

  const [staffList, bookings, adjustments] = await Promise.all([
    User.collection.find(staffFilter, {
      projection: { fullName: 1, email: 1, phone: 1, baseSalary: 1, commissionRate: 1 },
    }).sort({ fullName: 1 }).toArray(),
    Booking.find({
      ...(staffObjectId ? { staffId: staffObjectId } : {}),
      bookingDate: { $gte: start, $lt: end },
      status: 'completed',
      staffId: { $exists: true, $ne: null },
    })
      .populate('staffId', 'fullName email')
      .populate('userId', 'fullName phone')
      .populate('services', 'serviceName price commissionRate')
      .populate('estimatedBillId'),
    PayrollAdjustment.find({
      ...(staffObjectId ? { staffId: staffObjectId } : {}),
      month,
      year,
    }),
  ]);

  const adjustmentMap = new Map(adjustments.map(item => [item.staffId.toString(), item]));

  return staffList.map(staff => {
    const staffBookings = bookings.filter(booking => booking.staffId?._id?.toString() === staff._id.toString());
    const adjustment = adjustmentMap.get(staff._id.toString());
    const baseSalary = Number(staff.baseSalary || 0);
    const commissionRate = Number(staff.commissionRate ?? 10);
    const bookingDetails = staffBookings.map(booking => {
      const serviceBreakdown = (booking.services || []).map(service => {
        const usesDefaultCommission = service.commissionRate === null || service.commissionRate === undefined;
        const rate = Number(usesDefaultCommission ? commissionRate : service.commissionRate);
        const amount = Math.round(Number(service.price || 0) * rate / 100);
        return {
          serviceName: service.serviceName,
          price: Number(service.price || 0),
          commissionRate: rate,
          usesDefaultCommission,
          commissionAmount: amount,
        };
      });
      return {
        bookingId: booking._id.toString(),
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        customerName: booking.userId?.fullName || '',
        totalPrice: Number(booking.estimatedBillId?.totalPrice || 0),
        serviceBreakdown,
        commissionAmount: serviceBreakdown.reduce((sum, service) => sum + service.commissionAmount, 0),
      };
    });
    const revenue = bookingDetails.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const commissionAmount = bookingDetails.reduce((sum, booking) => sum + booking.commissionAmount, 0);
    const bonuses = adjustment?.bonuses?.length ? adjustment.bonuses : (adjustment?.bonus ? [{ amount: adjustment.bonus, reason: 'Thưởng' }] : []);
    const deductions = adjustment?.deductions?.length ? adjustment.deductions : (adjustment?.penalty ? [{ amount: adjustment.penalty, type: 'penalty', reason: 'Khấu trừ' }] : []);
    const bonus = bonuses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const penalty = deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSalary = baseSalary + commissionAmount + bonus - penalty;

    return {
      staffId: staff._id.toString(),
      staffName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      completedBookings: staffBookings.length,
      revenue,
      baseSalary,
      commissionRate,
      commissionAmount,
      bonus,
      penalty,
      bonuses,
      deductions,
      bookingDetails,
      totalSalary,
      note: adjustment?.note || '',
      status: adjustment?.status || 'draft',
    };
  });
}
