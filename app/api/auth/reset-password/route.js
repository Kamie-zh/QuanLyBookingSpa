import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
    const body = await request.json();
    const {
      email,
      otp,
      password,
      newPassword,
      confirmPassword,
      confirmNewPassword,
    } = body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedOtp = otp?.trim();
    const finalPassword = password || newPassword;
    const finalConfirmPassword = confirmPassword || confirmNewPassword;

    const missingFields = [];
    if (!normalizedEmail) missingFields.push('email');
    if (!normalizedOtp) missingFields.push('otp');
    if (!finalPassword) missingFields.push('new password');
    if (!finalConfirmPassword) missingFields.push('confirm password');

    if (missingFields.length > 0) {
      return NextResponse.json({
        message: `Please fill in all required fields: ${missingFields.join(', ')}`,
      }, { status: 400 });
    }

    if (finalPassword !== finalConfirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    if (finalPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await User.findOne({
      email: normalizedEmail,
      resetOtp: hashOtp(normalizedOtp),
      resetOtpExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    user.password = await bcrypt.hash(finalPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password changed successfully - Luxe Beauty Spa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; padding: 32px; border: 1px solid #D4AF37;">
          <h1 style="color: #8B6F47; text-align: center; font-size: 24px;">Password changed successfully</h1>
          <p style="color: #333;">Hello <strong>${user.fullName}</strong>,</p>
          <p style="color: #333;">Your Luxe Beauty Spa account password has been reset successfully.</p>
          <p style="color: #777; font-size: 13px;">If you did not make this change, please contact the administrator immediately.</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">Luxe Beauty Spa</p>
        </div>
      `,
      userId: user._id,
      emailType: 'reset_password',
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
