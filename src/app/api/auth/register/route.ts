import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  username: z
    .string()
    .min(3, 'Tên người dùng tối thiểu 3 ký tự')
    .max(30, 'Tên người dùng tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên người dùng chỉ chứa chữ cái, số và dấu gạch dưới'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, username, password, name } = result.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email này đã được đăng ký' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Tên người dùng này đã tồn tại' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: name || username,
        passwordHash,
        preferences: {
          create: {
            theme: 'system',
            readerTheme: 'light',
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Đăng ký tài khoản thành công',
    });

    response.cookies.set('zory_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
