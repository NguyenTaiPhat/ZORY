import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugifyVi } from '@/lib/utils';
import { StudioWorkspace } from '@/components/studio/StudioWorkspace';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return {
      title: 'Xưởng Sáng Tác — ZORY',
    };
  }

  const project = await prisma.aiProject.findFirst({
    where: { id: projectId, userId: user.id },
    select: { title: true, premise: true },
  });

  if (!project) {
    return {
      title: 'Bản Thảo Không Tồn Tại — ZORY',
    };
  }

  return {
    title: `${project.title} — Xưởng Sáng Tác`,
    description: project.premise?.slice(0, 160) || 'Biên soạn bản thảo truyện cùng AI',
  };
}

export default async function ProjectStudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=/studio/${projectId}`);
  }

  const project = await prisma.aiProject.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
    include: {
      characters: {
        orderBy: { createdAt: 'asc' },
      },
      outlines: {
        orderBy: { createdAt: 'desc' },
      },
      studioChapters: {
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Tự động liên kết sách nếu đã xuất bản trước đó nhưng chưa gán id/slug
  if (!project.publishedBookId || !project.publishedBookSlug) {
    const expectedSlug = slugifyVi(project.title);
    const existingBook = await prisma.book.findFirst({
      where: {
        authorId: user.id,
        OR: [
          { title: project.title },
          { slug: expectedSlug },
          { slug: { startsWith: `${expectedSlug}-` } },
        ],
      },
      select: { id: true, slug: true },
    });
    if (existingBook) {
      await prisma.aiProject.update({
        where: { id: project.id },
        data: {
          publishedBookId: existingBook.id,
          publishedBookSlug: existingBook.slug,
        },
      });
      project.publishedBookId = existingBook.id;
      project.publishedBookSlug = existingBook.slug;
    }
  }

  return <StudioWorkspace initialProject={project} />;
}
