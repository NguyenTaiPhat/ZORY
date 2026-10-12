import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserAiQuota } from '@/lib/ai/quota';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const aiQuota = await getUserAiQuota(user.id);

    return NextResponse.json({
      user: {
        ...user,
        aiQuota,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
