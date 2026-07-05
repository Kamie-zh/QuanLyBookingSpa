import { NextResponse } from 'next/server';

// POST - Upload image to ImgBB
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ message: 'Không tìm thấy file ảnh' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    if (!IMGBB_API_KEY) {
      return NextResponse.json({ message: 'Chưa cấu hình IMGBB_API_KEY' }, { status: 500 });
    }

    // Upload to ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append('key', IMGBB_API_KEY);
    imgbbForm.append('image', base64);
    imgbbForm.append('name', file.name || 'upload');

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbForm,
    });

    const imgbbData = await imgbbRes.json();

    if (!imgbbData.success) {
      console.error('ImgBB error:', imgbbData);
      return NextResponse.json({ message: 'Upload ảnh thất bại' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Upload thành công',
      url: imgbbData.data.display_url,
      thumb: imgbbData.data.thumb?.url,
      deleteUrl: imgbbData.data.delete_url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Lỗi server khi upload' }, { status: 500 });
  }
}
