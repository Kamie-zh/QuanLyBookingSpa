import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Vui lòng nhập email' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email (best-effort)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Đặt lại mật khẩu - Luxe Beauty Spa',
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; padding: 40px; border: 1px solid #D4AF37;">
            <h1 style="color: #8B6F47; text-align: center; font-size: 24px;">Đặt lại mật khẩu</h1>
            <hr style="border: 1px solid #D4AF37; margin: 20px 0;" />
            <p style="color: #333;">Xin chào <strong>${user.fullName}</strong>,</p>
            <p style="color: #333;">Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B6F47, #D4AF37); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 0.05em;">ĐẶT LẠI MẬT KHẨU</a>
            </div>
            <p style="color: #999; font-size: 13px;">Link này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">Luxe Beauty Spa - Nơi vẻ đẹp tỏa sáng</p>
          </div>
        `,
        userId: user._id,
        emailType: 'reset_password',
      });
    } catch (emailErr) {
      console.error('Reset email failed:', emailErr);
    }

    return NextResponse.json({ message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
