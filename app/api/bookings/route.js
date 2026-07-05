import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import EstimatedBill from '@/models/EstimatedBill';
import User from '@/models/User';
import Promotion from '@/models/Promotion';
import StaffUnavailability from '@/models/StaffUnavailability';
import { requireAuth } from '@/lib/auth';
import { sendEmail, bookingConfirmationTemplate, vipUpgradeTemplate } from '@/lib/email';
import { getVietnamDayRange, hoursUntilVietnamDateTime } from '@/lib/vietnamTime';

function toMinutes(time = '00:00') {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

// POST - Create booking (UC-06)
export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await connectDB();
    const { serviceIds, bookingDate, startTime, note, promotionId, staffId } = await request.json();

    if (!serviceIds?.length || !bookingDate || !startTime) {
      return NextResponse.json({ message: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    // Get services
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (services.length === 0) {
      return NextResponse.json({ message: 'Không tìm thấy dịch vụ' }, { status: 400 });
    }

    // Calculate total duration & price
    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
    const originalPrice = services.reduce((acc, s) => acc + s.price, 0);

    // Handle promotion discount
    let discountAmount = 0;
    let appliedPromotion = null;
    if (promotionId) {
      const now = new Date();
      const promotion = await Promotion.findOne({
        _id: promotionId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      if (promotion) {
        const userData2 = await User.findById(user.userId);
        if (promotion.targetMember === 'VIP' && userData2.memberType !== 'VIP') {
          return NextResponse.json({ message: 'Mã khuyến mãi này chỉ dành cho khách VIP' }, { status: 403 });
        }
        if (promotion.discountType === 'percent') {
          discountAmount = Math.round(originalPrice * promotion.discountValue / 100);
        } else {
          discountAmount = promotion.discountValue;
        }
        discountAmount = Math.min(discountAmount, originalPrice);
        appliedPromotion = promotion;
      }
    }
    const totalPrice = originalPrice - discountAmount;
    const bufferTime = 30;

    // Check time conflict
    const { start: queryDate, end: nextDay } = getVietnamDayRange(bookingDate);

    const newStartMinutes = toMinutes(startTime);
    const newEndMinutes = newStartMinutes + totalDuration + bufferTime;

    // Check 24-hour advance booking rule in Vietnam time.
    const diffHours = hoursUntilVietnamDateTime(bookingDate, startTime);

    if (diffHours < 24) {
      return NextResponse.json({ message: 'Chỉ được đặt lịch trước tối thiểu 24 giờ so với giờ hẹn' }, { status: 400 });
    }

    // Fetch all active staff
    const allStaff = await User.find({ role: 'staff' });
    if (allStaff.length === 0) {
      return NextResponse.json({ message: 'Không có nhân viên làm việc trên hệ thống' }, { status: 400 });
    }

    // All staff can perform every service. serviceType is only a category.
    const qualifiedStaff = [...allStaff];
    if (qualifiedStaff.length === 0) {
      return NextResponse.json({ message: 'Không có nhân viên nào phù hợp cho tất cả dịch vụ đã chọn' }, { status: 400 });
    }

    // Fetch existing bookings for this date
    const existingBookings = await Booking.find({
      bookingDate: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    });
    const unavailableItems = await StaffUnavailability.find({
      date: { $gte: queryDate, $lt: nextDay },
    });

    const checkStaffSlotAvailable = (staff) => {
      const staffUnavailable = unavailableItems.some(item => {
        if (item.staffId.toString() !== staff._id.toString()) return false;
        return newStartMinutes < toMinutes(item.endTime) && newEndMinutes > toMinutes(item.startTime);
      });
      if (staffUnavailable) return false;

      const staffBookings = existingBookings.filter(b => b.staffId && b.staffId.toString() === staff._id.toString());
      for (const b of staffBookings) {
        const exStart = toMinutes(b.startTime);
        const exEnd = exStart + b.estimatedDuration + b.bufferTime;
        if (newStartMinutes < exEnd && newEndMinutes > exStart) {
          return false;
        }
      }

      // Check capacity for random bookings
      const overlappingBookings = existingBookings.filter(b => {
        const exStart = toMinutes(b.startTime);
        const exEnd = exStart + b.estimatedDuration + b.bufferTime;
        return newStartMinutes < exEnd && newEndMinutes > exStart;
      });

      // If assigned to this staff, fail
      const assignedToThisStaff = overlappingBookings.filter(b => b.staffId && b.staffId.toString() === staff._id.toString());
      if (assignedToThisStaff.length > 0) return false;

      // Check random capacity
      const freeQualifiedStaff = qualifiedStaff.filter(st => {
        const assigned = overlappingBookings.filter(b => b.staffId && b.staffId.toString() === st._id.toString());
        const unavailable = unavailableItems.some(item => {
          if (item.staffId.toString() !== st._id.toString()) return false;
          return newStartMinutes < toMinutes(item.endTime) && newEndMinutes > toMinutes(item.startTime);
        });
        return assigned.length === 0 && !unavailable;
      });

      const randomBookings = overlappingBookings.filter(b => !b.staffId);
      if (randomBookings.length >= freeQualifiedStaff.length) {
        return false;
      }

      return true;
    };

    let assignedStaffId = undefined;

    if (staffId && staffId !== 'random') {
      // Specific staff selected
      const selectedStaff = allStaff.find(st => st._id.toString() === staffId);
      if (!selectedStaff) {
        return NextResponse.json({ message: 'Không tìm thấy nhân viên được chọn' }, { status: 400 });
      }
      const isQualified = true;
      if (!isQualified) {
        return NextResponse.json({ message: 'Nhân viên này không hỗ trợ dịch vụ đã chọn' }, { status: 400 });
      }
      if (!checkStaffSlotAvailable(selectedStaff)) {
        return NextResponse.json({ message: 'Nhân viên này đã bận trong khung giờ được chọn' }, { status: 400 });
      }
      assignedStaffId = selectedStaff._id;
    } else {
      // Random staff
      const availableStaff = qualifiedStaff.filter(staff => checkStaffSlotAvailable(staff));
      if (availableStaff.length === 0) {
        return NextResponse.json({ message: 'Tất cả nhân viên phù hợp đều bận trong khung giờ này' }, { status: 400 });
      }
      assignedStaffId = undefined;
    }

    // Create booking
    const booking = await Booking.create({
      userId: user.userId,
      staffId: assignedStaffId,
      services: serviceIds,
      bookingDate: queryDate,
      startTime,
      estimatedDuration: totalDuration,
      bufferTime,
      note: note || '',
      promotionId: appliedPromotion?._id || undefined,
      discountAmount,
    });

    // Create estimated bill
    const bill = await EstimatedBill.create({
      bookingId: booking._id,
      serviceItems: services.map((s) => ({
        serviceId: s._id,
        serviceName: s.serviceName,
        price: s.price,
        duration: s.duration,
      })),
      totalDuration,
      totalPrice,
      discountAmount,
      promotionTitle: appliedPromotion?.title || '',
    });

    // Link bill to booking
    booking.estimatedBillId = bill._id;
    await booking.save();

    // Update user stats
    const userData = await User.findById(user.userId);
    userData.totalBookings += 1;
    userData.totalEstimatedAmount += totalPrice;

    // VIP check (>= 5 bookings AND >= 5,000,000 VND)
    let upgradedToVip = false;
    if (userData.memberType !== 'VIP' && userData.totalBookings >= 5 && userData.totalEstimatedAmount >= 5000000) {
      userData.memberType = 'VIP';
      upgradedToVip = true;
    }
    await userData.save();

    if (upgradedToVip) {
      try {
        await sendEmail({
          to: userData.email,
          subject: 'Chúc mừng thành viên VIP - Luxe Beauty Spa',
          html: vipUpgradeTemplate({ fullName: userData.fullName }),
          userId: user.userId,
          emailType: 'vip_upgrade',
        });
      } catch (emailErr) {
        console.error('VIP upgrade email failed:', emailErr);
      }
    }

    // Send email with full details (best-effort)
    try {
      const serviceNames = services.map((s) => s.serviceName).join(', ');
      const dateStr = queryDate.toLocaleDateString('vi-VN');
      const serviceItems = services.map((s) => ({
        serviceName: s.serviceName,
        duration: s.duration,
        price: s.price,
      }));
      await sendEmail({
        to: userData.email,
        subject: 'Xác nhận đặt lịch - Luxe Beauty Spa',
        html: bookingConfirmationTemplate({
          fullName: userData.fullName,
          services: serviceNames,
          bookingDate: dateStr,
          startTime,
          totalPrice,
          totalDuration,
          serviceItems,
        }),
        userId: user.userId,
        emailType: 'booking',
      });
    } catch (emailErr) {
      console.error('Email send failed (best-effort):', emailErr);
    }

    return NextResponse.json({
      message: 'Đặt lịch thành công',
      booking: await Booking.findById(booking._id).populate('services').populate('estimatedBillId'),
    }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
