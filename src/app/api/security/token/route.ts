import { NextResponse } from 'next/server';
import { generateRequestToken, validateCsrfOrigin } from '@/lib/requestSecurity';

export async function GET(req: Request) {
  try {
    // 1. Kiểm tra Origin / Referer nếu có
    const originCheck = validateCsrfOrigin(req);
    if (!originCheck.valid) {
      return NextResponse.json(
        { error: originCheck.reason || 'Nguồn gốc không hợp lệ' },
        { status: 403 }
      );
    }

    const token = await generateRequestToken();
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 giờ

    const res = NextResponse.json({
      success: true,
      token,
      expiresAt,
    });

    // 2. Thiết lập cookie zory_req_token
    res.cookies.set('zory_req_token', token, {
      path: '/',
      maxAge: 4 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Để client script có thể đọc
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: 'Không thể cấp phát token bảo mật' }, { status: 500 });
  }
}
