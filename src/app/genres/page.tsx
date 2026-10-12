import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { Layers, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thể Loại Truyện',
  description: 'Danh mục các thể loại văn học, tiểu thuyết và truyện hư cấu trên ZORY.',
};

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { books: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-extrabold text-text-primary">
            Thể Loại Tác Phẩm
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Khám phá tất cả các thể loại truyện được phân loại chi tiết trên ZORY Platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {genres.map((genre) => (
          <Link
            key={genre.slug}
            href={`/genres/${genre.slug}`}
            className="group p-5 rounded-2xl bg-surface border border-border hover:border-primary card-hover transition space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary group-hover:text-primary transition">
                {genre.name}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-primary">
                {genre._count.books} truyện
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {genre.description || 'Thể loại văn học đặc sắc, mở ra những trải nghiệm kỳ thú.'}
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline pt-1">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
