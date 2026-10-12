import { NextResponse, type NextRequest } from 'next/server';
import { validateRequestSecurity } from '@/lib/requestSecurity';

export async function middleware(req: NextRequest) {
  const method = req.method.toUpperCase();
  const pathname = req.nextUrl.pathname;

  // 1. Cho phép endpoint cấp phát token bảo mật hoạt động mà không bị chặn
  if (pathname === '/api/security/token') {
    return NextResponse.next();
  }

  // 2. Kiểm tra mã xác thực ngẫu nhiên (Request Token & Nonce) trên:
  //    - Tất cả các mutation requests (POST, PUT, PATCH, DELETE)
  //    - Các API tài nguyên quan trọng như AI Studio (/api/ai/*) và TTS (/api/tts)
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isProtectedResource = pathname.startsWith('/api/ai/') || pathname.startsWith('/api/tts');

  if (isMutation || isProtectedResource) {
    const secCheck = await validateRequestSecurity(req);
    if (!secCheck.valid) {
      return NextResponse.json(
        { error: secCheck.reason || 'Yêu cầu bị từ chối: Thiếu hoặc sai mã xác thực ngẫu nhiên' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
