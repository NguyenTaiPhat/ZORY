import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'zory-super-secret-jwt-key-minimum-32-chars-long-2025'
);

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  aiTokensQuota: number;
  aiTokensUsed: number;
  ttsCharsQuota: number;
  ttsCharsUsed: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('zory_token')?.value;
    if (!token) return null;

    const verified = await verifySessionToken(token);
    if (!verified?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatarUrl: true,
        isBanned: true,
        aiTokensQuota: true,
        aiTokensUsed: true,
        ttsCharsQuota: true,
        ttsCharsUsed: true,
      },
    });

    if (!user || user.isBanned) return null;
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuthUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
