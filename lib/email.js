import nodemailer from 'nodemailer';
import connectDB from './mongodb';
import EmailLog from '@/models/EmailLog';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html, userId, emailType, attachments }) {
  try {
    await transporter.sendMail({
      from: `"Luxe Beauty Spa" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    // Log success
    try {
      await connectDB();
      await EmailLog.create({
        userId,
        emailType,
        subject,
        sentAt: new Date(),
        status: 'sent',
      });
    } catch (logErr) {
      console.error('Email log error:', logErr);
    }

    return { success: true };
  } catch (error) {
    console.error('Send email error:', error);

    // Log failure - best effort
    try {
      await connectDB();
      await EmailLog.create({
        userId,
        emailType,
        subject,
        sentAt: new Date(),
        status: 'failed',
      });
    } catch (logErr) {
      console.error('Email log error:', logErr);
    }

    return { success: false, error: error.message };
  }
}

export function bookingConfirmationTemplate({ fullName, services, bookingDate, startTime, totalPrice, totalDuration, serviceItems }) {
  const serviceRows = (serviceItems || []).map(s =>
    `<tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #F5F1E8;">${s.serviceName}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #F5F1E8; text-align: center;">${s.duration} phút</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #F5F1E8; text-align: right;">${s.price?.toLocaleString('vi-VN')} VNĐ</td>
    </tr>`
  ).join('');

  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #D4AF37; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8B6F47, #D4AF37); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Xác nhận đặt lịch thành công</h1>
      </div>
      <div style="padding: 30px 35px;">
        <p style="color: #333; font-size: 15px;">Xin chào <strong style="color: #8B6F47;">${fullName}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">Cảm ơn bạn đã đặt lịch tại <strong>Luxe Beauty Spa</strong>. Dưới đây là chi tiết lịch hẹn của bạn:</p>
        
        <div style="background: #F5F1E8; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold; width: 40%;">Ngày hẹn:</td>
              <td style="padding: 8px 0; font-weight: 600;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold;">Giờ hẹn:</td>
              <td style="padding: 8px 0; font-weight: 600;">${startTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold;">Tổng thời gian:</td>
              <td style="padding: 8px 0; font-weight: 600;">${totalDuration} phút</td>
            </tr>
          </table>
        </div>

        ${serviceItems && serviceItems.length > 0 ? `
        <h3 style="color: #8B6F47; font-size: 16px; margin-bottom: 10px;">Dịch vụ đã đặt</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #F5F1E8;">
              <th style="padding: 10px 16px; text-align: left; font-size: 13px; color: #8B6F47;">Dịch vụ</th>
              <th style="padding: 10px 16px; text-align: center; font-size: 13px; color: #8B6F47;">Thời gian</th>
              <th style="padding: 10px 16px; text-align: right; font-size: 13px; color: #8B6F47;">Giá</th>
            </tr>
          </thead>
          <tbody>${serviceRows}</tbody>
        </table>
        ` : `<p style="color: #555;">Dịch vụ: <strong>${services}</strong></p>`}

        <div style="background: linear-gradient(135deg, #8B6F47, #D4AF37); border-radius: 10px; padding: 15px 20px; text-align: center; margin: 20px 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 5px;">Hoá đơn dự tính</p>
          <p style="color: white; font-size: 26px; font-weight: 700; margin: 0;">${totalPrice?.toLocaleString('vi-VN')} VNĐ</p>
        </div>

        <div style="background: #FFF9E6; border: 1px solid #D4AF37; border-radius: 10px; padding: 15px; margin: 20px 0;">
          <p style="color: #8B6F47; font-weight: 600; margin: 0 0 5px;">Lưu ý quan trọng</p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0; padding-left: 20px;">
            <li>Vui lòng đến <strong>đúng giờ</strong> hoặc trước 5-10 phút để được phục vụ tốt nhất.</li>
            <li>Nếu cần huỷ lịch, vui lòng huỷ trước <strong>2 ngày</strong> so với giờ hẹn.</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #E5E0D8; margin-top: 25px; padding-top: 20px; text-align: center;">
          <p style="color: #8B6F47; font-weight: 600; font-size: 15px; margin-bottom: 5px;">Luxe Beauty Spa</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Hotline: 0901 234 567</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Giờ làm việc: 8:00 - 20:00 (Thứ 2 - Chủ nhật)</p>
        </div>
      </div>
    </div>
  `;
}

export function bookingStatusUpdateTemplate({ fullName, bookingDate, startTime, statusText, services, totalPrice, totalDuration, serviceItems }) {
  const serviceRows = (serviceItems || []).map(s =>
    `<tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #F5F1E8; font-size: 14px;">${s.serviceName}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #F5F1E8; text-align: center; font-size: 14px;">${s.duration} phút</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #F5F1E8; text-align: right; font-size: 14px;">${s.price?.toLocaleString('vi-VN')} VNĐ</td>
    </tr>`
  ).join('');


  const isConfirmed = statusText === 'Đã xác nhận';
  const headerColor = isConfirmed ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 'linear-gradient(135deg, #c0392b, #e74c3c)';

  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #D4AF37; border-radius: 8px; overflow: hidden;">
      <div style="background: ${headerColor}; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Cập nhật lịch hẹn: ${statusText}</h1>
      </div>
      <div style="padding: 30px 35px;">
        <p style="color: #333; font-size: 15px;">Xin chào <strong style="color: #8B6F47;">${fullName}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">Lịch hẹn của bạn đã được cập nhật trạng thái: <strong style="color: ${isConfirmed ? '#27ae60' : '#c0392b'};">${statusText}</strong></p>
        
        <div style="background: #F5F1E8; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold; width: 40%;">Ngày hẹn:</td>
              <td style="padding: 8px 0; font-weight: 600;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold;">Giờ hẹn:</td>
              <td style="padding: 8px 0; font-weight: 600;">${startTime}</td>
            </tr>
            ${totalDuration ? `<tr>
              <td style="padding: 8px 0; color: #8B6F47; font-weight: bold;">Tổng thời gian:</td>
              <td style="padding: 8px 0; font-weight: 600;">${totalDuration} phút</td>
            </tr>` : ''}
          </table>
        </div>

        ${serviceItems && serviceItems.length > 0 ? `
        <h3 style="color: #8B6F47; font-size: 16px; margin-bottom: 10px;">Dịch vụ đã đặt</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #F5F1E8;">
              <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #8B6F47;">Dịch vụ</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #8B6F47;">Thời gian</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 13px; color: #8B6F47;">Giá</th>
            </tr>
          </thead>
          <tbody>${serviceRows}</tbody>
        </table>
        ` : ''}

        ${totalPrice ? `
        <div style="background: linear-gradient(135deg, #8B6F47, #D4AF37); border-radius: 10px; padding: 15px 20px; text-align: center; margin: 20px 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 5px;">Hoá đơn dự tính</p>
          <p style="color: white; font-size: 26px; font-weight: 700; margin: 0;">${totalPrice?.toLocaleString('vi-VN')} VNĐ</p>
        </div>` : ''}

        ${isConfirmed ? `
        <div style="background: #FFF9E6; border: 1px solid #D4AF37; border-radius: 10px; padding: 15px; margin: 20px 0;">
          <p style="color: #8B6F47; font-weight: 600; margin: 0 0 5px;">Lưu ý</p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0; padding-left: 20px;">
            <li>Vui lòng đến <strong>đúng giờ</strong> hoặc trước 5-10 phút.</li>
            <li>Nếu cần huỷ, vui lòng huỷ trước <strong>1 ngày</strong>.</li>
          </ul>
        </div>` : ''}

        <div style="border-top: 1px solid #E5E0D8; margin-top: 25px; padding-top: 20px; text-align: center;">
          <p style="color: #8B6F47; font-weight: 600; font-size: 15px; margin-bottom: 5px;">Luxe Beauty Spa</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Hotline: 0901 234 567</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Giờ làm việc: 8:00 - 20:00 (Thứ 2 - Chủ nhật)</p>
        </div>
      </div>
    </div>
  `;
}

export function bookingCancellationTemplate({ fullName, bookingDate, startTime }) {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #D4AF37; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c0392b, #e74c3c); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Huỷ lịch hẹn</h1>
      </div>
      <div style="padding: 30px 35px;">
        <p style="color: #333; font-size: 15px;">Xin chào <strong style="color: #8B6F47;">${fullName}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">Lịch hẹn của bạn vào ngày <strong>${bookingDate}</strong> lúc <strong>${startTime}</strong> đã được huỷ thành công.</p>
        <p style="color: #555; line-height: 1.6;">Nếu cần đặt lại, vui lòng truy cập website của chúng tôi.</p>

        <div style="border-top: 1px solid #E5E0D8; margin-top: 25px; padding-top: 20px; text-align: center;">
          <p style="color: #8B6F47; font-weight: 600; font-size: 15px; margin-bottom: 5px;">Luxe Beauty Spa</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Hotline: 0901 234 567</p>
        </div>
      </div>
    </div>
  `;
}

export function vipUpgradeTemplate({ fullName }) {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #D4AF37; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8B6F47, #D4AF37); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 26px; font-family: 'Playfair Display', serif;">Chúc mừng thành viên VIP!</h1>
        <p style="color: #FFF9E6; font-size: 16px; margin: 10px 0 0;">Luxe Beauty Spa trân trọng vinh danh</p>
      </div>
      <div style="padding: 35px; text-align: center;">
        <p style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 15px;">Xin chào ${fullName},</p>
        <p style="color: #555; line-height: 1.8; font-size: 15px; text-align: left;">
          Chúc mừng bạn đã chính thức được nâng cấp lên hạng thành viên **VIP** của Luxe Beauty Spa!
          Đây là sự ghi nhận đặc biệt dành cho sự tin tưởng và gắn bó của bạn đối với các dịch vụ làm đẹp cao cấp của chúng tôi.
        </p>
        <div style="background: #FFF9E6; border: 1px dashed #D4AF37; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: left;">
          <h3 style="color: #8B6F47; font-size: 16px; margin: 0 0 12px; font-weight: bold;">Quyền lợi đặc biệt của thành viên VIP:</h3>
          <ul style="color: #555; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
            <li>Ưu tiên đặt lịch hẹn trước vào các khung giờ vàng.</li>
            <li>Độc quyền sử dụng các mã giảm giá, khuyến mãi VIP (lên tới 30-50%).</li>
            <li>Miễn phí nâng cấp phòng trị liệu riêng tư cao cấp (nếu còn phòng trống).</li>
            <li>Quà tặng sinh nhật đặc biệt từ cửa hàng.</li>
          </ul>
        </div>
        <p style="color: #555; line-height: 1.8; font-size: 15px; margin-bottom: 25px;">
          Hãy đăng nhập website Luxe Beauty Spa ngay hôm nay để khám phá những chương trình ưu đãi dành riêng cho bạn!
        </p>
        <div style="border-top: 1px solid #E5E0D8; padding-top: 25px; text-align: center;">
          <p style="color: #8B6F47; font-weight: 600; font-size: 16px; margin-bottom: 5px;">Luxe Beauty Spa</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          <p style="color: #999; font-size: 13px; margin: 3px 0;">Hotline: 0901 234 567</p>
        </div>
      </div>
    </div>
  `;
}
