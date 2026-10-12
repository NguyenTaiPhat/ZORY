import prisma from '@/lib/db';

export interface UserAiQuotaInfo {
  quota: number;
  used: number;
  remaining: number;
  resetAt: Date;
  countdown: string;
  isUnlimited?: boolean;
}

/**
 * Định dạng thời gian đếm ngược còn lại đến kỳ reset 5h kế tiếp
 */
export function formatCountdown(targetDate: Date): string {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Đang làm mới...';

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
}

/**
 * Lấy hạn mức token của người dùng kèm cơ chế tự động reset sau mỗi 5 giờ
 */
export async function getUserAiQuota(userId: string): Promise<UserAiQuotaInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      aiTokensQuota: true,
      aiTokensUsed: true,
      aiQuotaResetAt: true,
    },
  });

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  if (isAdmin) {
    return {
      quota: 999999999,
      used: user.aiTokensUsed,
      remaining: 999999999,
      resetAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      countdown: 'Không giới hạn',
      isUnlimited: true,
    };
  }

  const now = Date.now();
  let resetAt = user.aiQuotaResetAt;
  let used = user.aiTokensUsed;

  // Nếu chưa có mốc reset hoặc đã trôi qua chu kỳ 5h -> Reset về 0 và lập chu kỳ 5h mới
  if (!resetAt || now >= new Date(resetAt).getTime()) {
    const nextReset = new Date(now + 5 * 60 * 60 * 1000); // 5 tiếng tiếp theo
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiTokensUsed: 0,
        aiQuotaResetAt: nextReset,
      },
    });
    resetAt = nextReset;
    used = 0;
  }

  const quota = user.aiTokensQuota;
  const remaining = Math.max(0, quota - used);

  return {
    quota,
    used,
    remaining,
    resetAt: new Date(resetAt),
    countdown: formatCountdown(new Date(resetAt)),
    isUnlimited: false,
  };
}

/**
 * Khấu trừ token sau khi AI phản hồi thành công và trả về thông tin hạn mức mới nhất
 */
export async function consumeUserAiTokens(
  userId: string,
  tokensUsed: number
): Promise<UserAiQuotaInfo> {
  const current = await getUserAiQuota(userId);
  if (!current) {
    throw new Error('Không tìm thấy người dùng');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      aiTokensUsed: { increment: tokensUsed },
    },
    select: {
      role: true,
      aiTokensQuota: true,
      aiTokensUsed: true,
      aiQuotaResetAt: true,
    },
  });

  const isAdmin = updated.role === 'ADMIN';
  if (isAdmin) {
    return {
      quota: 999999999,
      used: updated.aiTokensUsed,
      remaining: 999999999,
      resetAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      countdown: 'Không giới hạn',
      isUnlimited: true,
    };
  }

  const quota = updated.aiTokensQuota;
  const used = updated.aiTokensUsed;
  const remaining = Math.max(0, quota - used);
  const resetAt = updated.aiQuotaResetAt || current.resetAt;

  return {
    quota,
    used,
    remaining,
    resetAt: new Date(resetAt),
    countdown: formatCountdown(new Date(resetAt)),
    isUnlimited: false,
  };
}
