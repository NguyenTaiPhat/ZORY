import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { validateCsrfOrigin } from '@/lib/csrf';

// Cơ chế Account Lockout in-memory
interface FailedLoginTracker {
  attempts: number;
  lockedUntil?: number;
}
const failedLoginMap = new Map<string, FailedLoginTracker>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 phút

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập email hoặc tên người dùng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export async function POST(req: Request) {
  try {
    // 1. Chống CSRF: Xác minh Origin / Referer
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.reason || 'CSRF: Nguồn gốc yêu cầu không hợp lệ' },
        { status: 403 }
      );
    }

    // 2. Chống brute-force: Giới hạn tần suất gọi từ IP (tối đa 20 lần/phút)
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`login:ip:${ip}`, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { identifier, password } = result.data;
    const normalizedKey = identifier.toLowerCase().trim();
    const now = Date.now();
    const tracker = failedLoginMap.get(normalizedKey);

    // 3. Kiểm tra trạng thái khóa tạm (Account Lockout)
    if (tracker?.lockedUntil && now < tracker.lockedUntil) {
      const remainingMinutes = Math.ceil((tracker.lockedUntil - now) / 60000);
      return NextResponse.json(
        {
          error: `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      // Ghi nhận lần thử thất bại
      const attempts = (tracker?.attempts || 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        failedLoginMap.set(normalizedKey, { attempts, lockedUntil: now + LOCKOUT_DURATION_MS });
        return NextResponse.json(
          { error: 'Tài khoản tạm thời bị khóa 15 phút do nhập sai mật khẩu quá 5 lần.' },
          { status: 429 }
        );
      }
      failedLoginMap.set(normalizedKey, { attempts });

      return NextResponse.json(
        { error: 'Email/Tên người dùng hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      // Ghi nhận lần thử mật khẩu sai
      const attempts = (tracker?.attempts || 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        failedLoginMap.set(normalizedKey, { attempts, lockedUntil: now + LOCKOUT_DURATION_MS });
        return NextResponse.json(
          { error: 'Tài khoản tạm thời bị khóa 15 phút do nhập sai mật khẩu quá 5 lần.' },
          { status: 429 }
        );
      }
      failedLoginMap.set(normalizedKey, { attempts });

      return NextResponse.json(
        { error: 'Email/Tên người dùng hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Đăng nhập thành công -> Xóa bộ đếm thất bại
    failedLoginMap.delete(normalizedKey);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      message: 'Đăng nhập thành công',
    });

    response.cookies.set('zory_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
