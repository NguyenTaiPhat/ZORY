import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
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

  return <StudioWorkspace initialProject={project} />;
}
