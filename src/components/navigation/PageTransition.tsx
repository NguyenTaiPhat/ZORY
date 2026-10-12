'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PageMotion } from '@/components/motion/PageMotion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <PageMotion key={pathname}>{children}</PageMotion>;
}
