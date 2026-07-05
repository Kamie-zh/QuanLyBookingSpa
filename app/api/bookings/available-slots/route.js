import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import User from '@/models/User';
import StaffUnavailability from '@/models/StaffUnavailability';
import { getVietnamDayRange, hoursUntilVietnamDateTime } from '@/lib/vietnamTime';

function toMinutes(time = '00:00') {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId'); // ObjectId, 'random', or empty
    const serviceIdsParam = searchParams.get('serviceIds'); // comma separated service IDs
    const excludeBookingId = searchParams.get('excludeBookingId');

    if (!date) {
      return NextResponse.json({ message: 'Vui lòng chọn ngày' }, { status: 400 });
    }

    const { start: queryDate, end: nextDay } = getVietnamDayRange(date);

    // Fetch all active staff members
    const allStaff = await User.find({ role: 'staff' });
    if (allStaff.length === 0) {
      return NextResponse.json({ date, availableSlots: [], message: 'Không có nhân viên nào trên hệ thống' });
    }

    // All staff can perform every service. serviceType is only a category.
    const qualifiedStaff = [...allStaff];
    let totalDuration = 60; // Default fallback duration
    if (serviceIdsParam) {
      const serviceIds = serviceIdsParam.split(',').filter(Boolean);
      if (serviceIds.length > 0) {
        const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
        if (services.length > 0) {
          totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
          
        }
      }
    }

    if (qualifiedStaff.length === 0) {
      return NextResponse.json({ date, availableSlots: [], message: 'Không có nhân viên nào phù hợp cho các dịch vụ này' });
    }

    // Get all bookings on this date (not cancelled)
    const bookingFilter = {
      bookingDate: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    };
    if (excludeBookingId) {
      bookingFilter._id = { $ne: excludeBookingId };
    }
    const bookings = await Booking.find(bookingFilter);
    const unavailableItems = await StaffUnavailability.find({
      date: { $gte: queryDate, $lt: nextDay },
    });

    // Generate all standard slots (8:00 - 20:00, every 30 min)
    const allSlots = [];
    for (let h = 8; h < 20; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`);
      allSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Helper to check if a staff member is free for a slot
    const checkStaffSlotAvailable = (staff, slotTime) => {
      if (hoursUntilVietnamDateTime(date, slotTime) < 24) return false;
      const newStart = toMinutes(slotTime);
      const newEnd = newStart + totalDuration + 30; // total duration + 30m buffer

      // Check if slot falls out of working hours (8:00 - 20:00)
      if (newEnd > 20 * 60) return false;

      const staffUnavailable = unavailableItems.some(item => {
        if (item.staffId.toString() !== staff._id.toString()) return false;
        return newStart < toMinutes(item.endTime) && newEnd > toMinutes(item.startTime);
      });
      if (staffUnavailable) return false;

      // Check against existing bookings for this staff
      const staffBookings = bookings.filter(b => b.staffId && b.staffId.toString() === staff._id.toString());
      
      for (const b of staffBookings) {
        const exStart = toMinutes(b.startTime);
        const exEnd = exStart + b.estimatedDuration + b.bufferTime;

        // Overlap condition
        if (newStart < exEnd && newEnd > exStart) {
          return false;
        }
      }

      // Also check against "Random" bookings that have not been assigned yet.
      // To be conservative and avoid overbooking, random bookings should block slots.
      // But wait! A random booking doesn't have a staffId. Does it block a slot?
      // Yes, if there is a random booking at time T, it will eventually need a staff member.
      // A random booking blocks 1 slot of capacity.
      // So at time T, if we have K qualified staff members, and there are R bookings (assigned + random) overlapping,
      // we must have at least 1 free staff member.
      // Let's implement this capacity-based check for a slot.
      const overlappingBookings = bookings.filter(b => {
        const exStart = toMinutes(b.startTime);
        const exEnd = exStart + b.estimatedDuration + b.bufferTime;
        return newStart < exEnd && newEnd > exStart;
      });

      // Filter bookings that are assigned to this specific staff member
      const assignedToThisStaff = overlappingBookings.filter(b => b.staffId && b.staffId.toString() === staff._id.toString());
      if (assignedToThisStaff.length > 0) return false;

      // For this specific staff member, if they are not assigned, they might be chosen for a random booking.
      // If we are checking slot for a specific staff member, we must check if there is enough staff capacity left
      // after accounting for other assigned bookings and random bookings.
      // Let's calculate:
      // Number of staff qualified who are NOT assigned to other bookings in this slot
      const freeQualifiedStaff = qualifiedStaff.filter(st => {
        const assigned = overlappingBookings.filter(b => b.staffId && b.staffId.toString() === st._id.toString());
        const unavailable = unavailableItems.some(item => {
          if (item.staffId.toString() !== st._id.toString()) return false;
          return newStart < toMinutes(item.endTime) && newEnd > toMinutes(item.startTime);
        });
        return assigned.length === 0 && !unavailable;
      });

      const randomBookings = overlappingBookings.filter(b => !b.staffId);
      
      // If the number of unassigned (random) bookings equals or exceeds the number of free qualified staff,
      // then no free staff member is truly available.
      if (randomBookings.length >= freeQualifiedStaff.length) {
        return false;
      }

      return true;
    };

    let availableSlots = [];

    if (staffId && staffId !== 'random') {
      // Case 1: Specific staff
      const selectedStaff = allStaff.find(st => st._id.toString() === staffId);
      if (!selectedStaff) {
        return NextResponse.json({ message: 'Không tìm thấy nhân viên đã chọn' }, { status: 400 });
      }
      
      // Check if this staff is qualified
      const isQualified = true;
      if (!isQualified) {
        return NextResponse.json({ date, availableSlots: [], message: 'Nhân viên này không hỗ trợ dịch vụ đã chọn' });
      }

      availableSlots = allSlots.filter(slot => checkStaffSlotAvailable(selectedStaff, slot));
    } else {
      // Case 2: Random / General
      // Slot is available if AT LEAST ONE qualified staff member is free for it
      availableSlots = allSlots.filter(slot => {
        return qualifiedStaff.some(staff => checkStaffSlotAvailable(staff, slot));
      });
    }

    return NextResponse.json({ date, availableSlots, totalSlots: allSlots.length });
  } catch (error) {
    console.error('Available slots error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
