import { redirect } from 'next/navigation';

export default async function GenreSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/explore?genre=${slug}`);
}
