import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ message: 'Please enter your email' }, { status: 400 });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ message: 'Email not found' }, { status: 404 });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtp = hashOtp(otp);
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Password reset OTP - Luxe Beauty Spa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; padding: 32px; border: 1px solid #D4AF37;">
          <h1 style="color: #8B6F47; text-align: center; font-size: 24px;">Password reset OTP</h1>
          <p style="color: #333;">Hello <strong>${user.fullName}</strong>,</p>
          <p style="color: #333;">Use the OTP code below to reset your password. This code is valid for 10 minutes.</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #8B6F47; background: #F5F1E8; padding: 16px 24px; border-radius: 8px;">${otp}</span>
          </div>
          <p style="color: #777; font-size: 13px;">If you did not request a password reset, please ignore this email.</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">Luxe Beauty Spa</p>
        </div>
      `,
      userId: user._id,
      emailType: 'reset_password',
    });

    if (!emailResult.success) {
      return NextResponse.json({ message: 'Could not send OTP email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP has been sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
