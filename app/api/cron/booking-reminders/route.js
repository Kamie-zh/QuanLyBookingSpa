import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/EstimatedBill';
import { sendEmail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET || 'spa-cron-secret-2024';

const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

function bookingReminderTemplate({ fullName, bookingDate, startTime, services, totalPrice, totalDuration, staffName }) {
  const serviceRows = (services || []).map(service => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #F5F1E8;">${service.serviceName}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #F5F1E8; text-align: center;">${service.duration || 0} phut</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #F5F1E8; text-align: right;">${formatCurrency(service.price)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #FDFBF7; border: 1px solid #D4AF37; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8B6F47, #D4AF37); padding: 28px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Nhac lich hen tai Luxe Beauty Spa</h1>
      </div>
      <div style="padding: 28px 32px; color: #2D2A26;">
        <p style="font-size: 15px;">Xin chao <strong style="color: #8B6F47;">${fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #555;">Luxe Beauty Spa xin nhac ban ve lich hen sap toi. Vui long den som 5-10 phut de duoc phuc vu tot nhat.</p>

        <div style="background: #F5F1E8; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong style="color: #8B6F47;">Ngay hen:</strong> ${bookingDate}</p>
          <p style="margin: 6px 0;"><strong style="color: #8B6F47;">Gio hen:</strong> ${startTime}</p>
          <p style="margin: 6px 0;"><strong style="color: #8B6F47;">Thoi luong:</strong> ${totalDuration} phut</p>
          ${staffName ? `<p style="margin: 6px 0;"><strong style="color: #8B6F47;">Chuyen vien:</strong> ${staffName}</p>` : ''}
        </div>

        ${services?.length ? `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr style="background: #F5F1E8;">
                <th style="padding: 10px 14px; text-align: left; color: #8B6F47;">Dich vu</th>
                <th style="padding: 10px 14px; text-align: center; color: #8B6F47;">TG</th>
                <th style="padding: 10px 14px; text-align: right; color: #8B6F47;">Gia</th>
              </tr>
            </thead>
            <tbody>${serviceRows}</tbody>
          </table>
        ` : ''}

        <div style="background: #2d6a4f; color: white; border-radius: 10px; padding: 16px; text-align: center; margin-top: 20px;">
          <p style="margin: 0 0 5px; opacity: 0.85;">Hoa don du tinh</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700;">${formatCurrency(totalPrice)}</p>
        </div>

        <div style="border-top: 1px solid #E5E0D8; margin-top: 24px; padding-top: 18px; text-align: center; color: #888; font-size: 13px;">
          <p style="color: #8B6F47; font-weight: 700; margin: 0 0 4px;">Luxe Beauty Spa</p>
          <p style="margin: 3px 0;">Hotline: 0901 234 567</p>
        </div>
      </div>
    </div>
  `;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const upper = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateFloor = new Date(now);
    dateFloor.setHours(0, 0, 0, 0);
    const dateCeiling = new Date(upper);
    dateCeiling.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      status: { $in: ['pending', 'confirmed'] },
      reminderSentAt: { $exists: false },
      bookingDate: { $gte: dateFloor, $lte: dateCeiling },
    })
      .populate('userId', 'fullName email')
      .populate('staffId', 'fullName')
      .populate('services', 'serviceName price duration')
      .populate('estimatedBillId');

    let sentCount = 0;
    const errors = [];

    for (const booking of bookings) {
      const [hour = 0, minute = 0] = (booking.startTime || '00:00').split(':').map(Number);
      const bookingTime = new Date(booking.bookingDate);
      bookingTime.setHours(hour, minute, 0, 0);
      const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

      if (hoursUntilBooking <= 0 || hoursUntilBooking > 24) continue;
      if (!booking.userId?.email) continue;

      const result = await sendEmail({
        to: booking.userId.email,
        subject: 'Nhac lich hen - Luxe Beauty Spa',
        html: bookingReminderTemplate({
          fullName: booking.userId.fullName,
          bookingDate: formatDate(booking.bookingDate),
          startTime: booking.startTime,
          services: booking.services,
          totalPrice: booking.estimatedBillId?.totalPrice,
          totalDuration: booking.estimatedDuration,
          staffName: booking.staffId?.fullName,
        }),
        userId: booking.userId._id,
        emailType: 'booking_reminder',
      });

      if (result?.success) {
        booking.reminderSentAt = new Date();
        await booking.save();
        sentCount++;
      } else {
        errors.push({ bookingId: booking._id, error: result?.error || 'Send email failed' });
      }
    }

    return NextResponse.json({
      message: `Reminder completed: ${sentCount} email(s) sent`,
      sentCount,
      checkedCount: bookings.length,
      errors: errors.length ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Booking reminder cron error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
