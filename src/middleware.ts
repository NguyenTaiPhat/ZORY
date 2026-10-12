import { NextResponse, type NextRequest } from 'next/server';
import { validateCsrfOrigin } from '@/lib/csrf';

export function middleware(req: NextRequest) {
  const method = req.method.toUpperCase();

  // 1. Kiểm tra CSRF toàn cục trên tất cả các mutation requests (/api/*)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.reason || 'CSRF: Nguồn gốc yêu cầu không hợp lệ' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
