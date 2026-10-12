import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';
import { validateCsrfOrigin } from '@/lib/csrf';
import { parseSecureRequest } from '@/lib/requestCrypto';

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isBanned: true,
        aiTokensQuota: true,
        aiTokensUsed: true,
        ttsCharsQuota: true,
        ttsCharsUsed: true,
        createdAt: true,
        _count: {
          select: {
            books: true,
            comments: true,
            aiProjects: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.reason || 'CSRF: Nguồn gốc yêu cầu không hợp lệ' },
        { status: 403 }
      );
    }

    const admin = await requireAdminUser();
    const { data: body } = await parseSecureRequest<any>(req);
    const { userId, role, isBanned, aiTokensQuota, ttsCharsQuota, addTokens, resetUsed } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (ttsCharsQuota !== undefined) updateData.ttsCharsQuota = Number(ttsCharsQuota);

    if (addTokens !== undefined && Number(addTokens) !== 0) {
      updateData.aiTokensQuota = { increment: Number(addTokens) };
    } else if (aiTokensQuota !== undefined) {
      updateData.aiTokensQuota = Number(aiTokensQuota);
    }

    if (resetUsed === true) {
      updateData.aiTokensUsed = 0;
      updateData.aiQuotaResetAt = new Date(Date.now() + 5 * 60 * 60 * 1000);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_USER',
        targetType: 'USER',
        targetId: userId,
        details: JSON.stringify({ role, isBanned, aiTokensQuota, ttsCharsQuota, addTokens, resetUsed }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi cập nhật người dùng' }, { status: 500 });
  }
}
