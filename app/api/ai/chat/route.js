import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import User from '@/models/User';
import Promotion from '@/models/Promotion';

export async function POST(request) {
  try {
    await connectDB();
    const { messages } = await request.json();

    if (!messages || !messages.length) {
      return NextResponse.json({ message: 'Vui lòng nhập nội dung tin nhắn' }, { status: 400 });
    }

    // 1. Fetch live context from database
    const [services, staff, promotions] = await Promise.all([
      Service.find({ isActive: true }),
      User.find({ role: 'staff' }),
      Promotion.find({ isActive: true })
    ]);

    const servicesListText = services.map(s => 
      `- **${s.serviceName}** (${s.serviceType}): ${s.duration} phút, Giá: ${s.price?.toLocaleString('vi-VN')}đ. Mô tả: ${s.description || 'Đang cập nhật'}`
    ).join('\n');

    const staffListText = staff.map(st => 
      `- Chuyên viên **${st.fullName}** (Chuyên gia)`
    ).join('\n');

    const promotionsListText = promotions.map(p => {
      const discVal = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('vi-VN')}đ`;
      return `- **${p.title}**: ${p.description || 'Ưu đãi'} (Giảm ${discVal} cho ${p.targetMember === 'VIP' ? 'thành viên VIP' : 'tất cả khách hàng'})`;
    }).join('\n');

    // 2. Build system instruction with dynamic database content
    const systemInstruction = `Bạn là trợ lý ảo AI thông minh, tinh tế của Luxe Beauty Spa. 
Nhiệm vụ của bạn là tư vấn các dịch vụ Spa, Nail, Makeup dựa trên danh sách dữ liệu thực tế được cung cấp bên dưới.

DANH SÁCH DỊCH VỤ HIỆN CÓ:
${servicesListText}

DANH SÁCH NHÂN VIÊN/CHUYÊN VIÊN:
${staffListText}

CHƯƠNG TRÌNH KHUYẾN MÃI HOẠT ĐỘNG:
${promotionsListText}

CÁC QUY ĐỊNH CỦA SPA:
- Khách hàng đặt lịch trước tối thiểu 24 giờ.
- Hủy lịch hẹn miễn phí trước tối thiểu 48 giờ.
- Đặt lịch từ 5 lần trở lên và hóa đơn đạt từ 5.000.000đ sẽ tự động nâng cấp lên thành viên VIP (giảm giá 20-30%).
- Thời gian mở cửa: 8:00 - 20:00 hàng ngày.

QUY TẮC PHẢN HỒI QUAN TRỌNG:
1. Hãy trả lời ngắn gọn, lịch sự, xưng hô tôn trọng ("dạ", "ạ", "quý khách", "bạn"). Sử dụng Tiếng Việt.
2. Dịch vụ không tồn tại: Nếu khách hàng hỏi những dịch vụ spa không cung cấp (ví dụ: cắt tóc, làm tóc, nhuộm tóc, uốn tóc...), hãy trả lời rõ ràng và lịch sự là spa "không hỗ trợ" dịch vụ này. Sau đó gợi ý các dịch vụ thư giãn, làm đẹp móng và makeup hiện có ở trên.
3. Tư vấn theo nhu cầu thực tế:
   - Người đau đầu, mệt mỏi, stress, vai gáy: Đề xuất liệu trình có từ khóa massage thư giãn toàn thân, xông hơi thảo dược.
   - Khách đi tiệc, sự kiện: Đề xuất dịch vụ Trang Điểm Dự Tiệc.
   - Khách đám cưới, cô dâu: Đề xuất dịch vụ Trang Điểm Cô Dâu.
   - Làm móng, vẽ móng: Đề xuất các gói Nail Art Design, sơn gel, phủ bột.
4. Giá cả: Nếu khách hỏi dịch vụ rẻ nhất, hãy tìm dịch vụ có giá thấp nhất trong danh sách dịch vụ và trả lời chính xác tên và giá của nó.
5. Luôn dùng định dạng Markdown đơn giản (như **in đậm** tên dịch vụ, dấu gạch đầu dòng) để trình bày văn bản dễ đọc và chuyên nghiệp. Không dùng định dạng HTML thô.`;

    const geminiKey = process.env.GEMINI_API_KEY;

    // Check if key is absent or appears to be a placeholder
    const isKeyInvalid = !geminiKey || geminiKey.trim() === '' || geminiKey.startsWith('mã_api_key_');

    if (isKeyInvalid) {
      return NextResponse.json({ message: 'Dạ, hệ thống AI chưa được cấu hình API Key.' }, { status: 400 });
    }

    const isBeeknoeeKey = geminiKey.startsWith('sk-');

    try {
      if (isBeeknoeeKey) {
        // OpenAI-compatible Chat Completions payload for Beeknoee
        const apiMessages = [
          { role: 'system', content: systemInstruction },
          ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        ];

        const response = await fetch(
          'https://platform.beeknoee.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${geminiKey}`
            },
            body: JSON.stringify({
              model: 'gemini-2.5-flash',
              messages: apiMessages
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          console.error('Beeknoee API Error details:', data);
          return NextResponse.json({ message: data.error?.message || 'Lỗi API từ đối tác' }, { status: response.status });
        }

        const replyText = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể xử lý câu hỏi này lúc này.';
        return NextResponse.json({ content: replyText });

      } else {
        // Map message history to Gemini API format (only user and model roles)
        const contents = messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Call Google Gemini 1.5 API using standard systemInstruction payload
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              }
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          console.error('Gemini API Error details:', data);
          return NextResponse.json({ message: data.error?.message || 'Lỗi kết nối Gemini API' }, { status: response.status });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể xử lý câu hỏi này lúc này.';
        return NextResponse.json({ content: replyText });
      }

    } catch (apiError) {
      console.error('Failed to communicate with AI API:', apiError);
      return NextResponse.json({ message: 'Lỗi kết nối dịch vụ AI. Vui lòng thử lại sau.' }, { status: 500 });
    }

  } catch (error) {
    console.error('AI Chat Route Error:', error);
    return NextResponse.json({ message: 'Lỗi AI phục vụ tư vấn' }, { status: 500 });
  }
}
