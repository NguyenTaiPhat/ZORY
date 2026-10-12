import { readFileSync, existsSync } from 'node:fs';
import prisma from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';

if (existsSync('.env')) {
  try {
    const envLines = readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').replace(/^["']|["']$/g, '').trim();
      }
    }
} catch (_) {}
}

import { createSecurityHeaders } from '../../src/lib/requestSecurity';

// Patch globalThis.fetch cho test runner nếu chưa patch
if (!(globalThis as any).__testFetchPatched) {
  (globalThis as any).__testFetchPatched = true;
  const originalTestFetch = globalThis.fetch;
  globalThis.fetch = async (input: any, init?: any) => {
    let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input?.url || '');
    if (url.includes('/api/')) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
      
      // Chỉ tự động gắn nếu bài test không yêu cầu bỏ qua (x-skip-auto-token)
      if (!headers.has('x-request-token') && !headers.has('x-skip-auto-token')) {
        const secHeaders = await createSecurityHeaders();
        for (const [k, v] of Object.entries(secHeaders)) {
          if (!headers.has(k)) {
            headers.set(k, v);
          }
        }
      }

      const newInit = { ...init, headers };
      if (input instanceof Request) {
        return originalTestFetch(new Request(input, newInit));
      }
      return originalTestFetch(input, newInit);
    }
    return originalTestFetch(input, init);
  };
}

export interface TestContext {
  adminUser: any;
  adminCookie: string;
  authorA: any;
  authorACookie: string;
  authorB: any;
  authorBCookie: string;
  normalUser: any;
  normalUserCookie: string;
  projectA: any;
  loreEntryA: any;
  bookA: any;
  publishedChapterA: any;
  draftChapterA: any;
}

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

export async function setupTestEnvironment(): Promise<TestContext> {
  const passwordHash = await hashPassword('SecurityTest123!');

  // Dọn dẹp dữ liệu kiểm thử cũ nếu có
  await cleanupTestEnvironment();

  // 1. Tạo tài khoản Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'sec_admin@zory.test',
      username: 'sec_admin',
      name: 'Security Admin',
      role: 'ADMIN',
      passwordHash,
      aiTokensQuota: 999999999,
      ttsCharsQuota: 999999999,
    },
  });
  const adminToken = await createSessionToken({
    userId: adminUser.id,
    email: adminUser.email,
    username: adminUser.username,
    role: adminUser.role,
  });

  // 2. Tạo tài khoản Tác giả A
  const authorA = await prisma.user.create({
    data: {
      email: 'sec_author_a@zory.test',
      username: 'sec_author_a',
      name: 'Security Author A',
      role: 'AUTHOR',
      passwordHash,
      aiTokensQuota: 50000,
      ttsCharsQuota: 30000,
    },
  });
  const authorAToken = await createSessionToken({
    userId: authorA.id,
    email: authorA.email,
    username: authorA.username,
    role: authorA.role,
  });

  // 3. Tạo tài khoản Tác giả B
  const authorB = await prisma.user.create({
    data: {
      email: 'sec_author_b@zory.test',
      username: 'sec_author_b',
      name: 'Security Author B',
      role: 'AUTHOR',
      passwordHash,
      aiTokensQuota: 50000,
      ttsCharsQuota: 30000,
    },
  });
  const authorBToken = await createSessionToken({
    userId: authorB.id,
    email: authorB.email,
    username: authorB.username,
    role: authorB.role,
  });

  // 4. Tạo tài khoản Người dùng thường
  const normalUser = await prisma.user.create({
    data: {
      email: 'sec_user_normal@zory.test',
      username: 'sec_user_normal',
      name: 'Security Normal User',
      role: 'USER',
      passwordHash,
      aiTokensQuota: 50000,
      ttsCharsQuota: 30000,
    },
  });
  const normalUserToken = await createSessionToken({
    userId: normalUser.id,
    email: normalUser.email,
    username: normalUser.username,
    role: normalUser.role,
  });

  // 5. Tạo Project & Lore của Tác giả A
  const projectA = await prisma.aiProject.create({
    data: {
      userId: authorA.id,
      title: 'Bí Mật Tác Giả A',
      premise: 'Ý tưởng tiểu thuyết chưa công bố của Tác giả A',
      genre: 'Huyền huyễn',
    },
  });

  const loreEntryA = await prisma.loreEntry.create({
    data: {
      projectId: projectA.id,
      name: 'Nhân Vật Tuyệt Mật A',
      category: 'CHARACTER',
      summary: 'Thông tin nhân vật bảo mật của Tác giả A',
    },
  });

  // 6. Tạo Tác phẩm & Chương (Published + Draft) của Tác giả A
  const bookA = await prisma.book.create({
    data: {
      title: 'Tác Phẩm Bảo Mật A',
      slug: 'tac-pham-bao-mat-a-sec-test',
      summary: 'Tác phẩm phục vụ kiểm thử an ninh',
      authorId: authorA.id,
      authorName: authorA.name,
      publishStatus: 'PUBLISHED',
    },
  });

  const publishedChapterA = await prisma.chapter.create({
    data: {
      bookId: bookA.id,
      chapterNumber: 1,
      title: 'Chương 1 Công Khai',
      content: 'Nội dung chương 1 đã xuất bản cho độc giả.',
      publishStatus: 'PUBLISHED',
    },
  });

  const draftChapterA = await prisma.chapter.create({
    data: {
      bookId: bookA.id,
      chapterNumber: 2,
      title: 'Chương 2 Bản Thảo Bí Mật',
      content: 'BẢN THẢO BÍ MẬT: Chưa xuất bản, chỉ tác giả A được xem.',
      publishStatus: 'DRAFT',
    },
  });

  return {
    adminUser,
    adminCookie: `zory_token=${adminToken}`,
    authorA,
    authorACookie: `zory_token=${authorAToken}`,
    authorB,
    authorBCookie: `zory_token=${authorBToken}`,
    normalUser,
    normalUserCookie: `zory_token=${normalUserToken}`,
    projectA,
    loreEntryA,
    bookA,
    publishedChapterA,
    draftChapterA,
  };
}

export async function cleanupTestEnvironment(): Promise<void> {
  const testUsernames = ['sec_admin', 'sec_author_a', 'sec_author_b', 'sec_user_normal'];
  await prisma.user.deleteMany({
    where: { username: { in: testUsernames } },
  });
  await prisma.book.deleteMany({
    where: { slug: 'tac-pham-bao-mat-a-sec-test' },
  });
}
