'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-enter flex-1 flex flex-col w-full min-w-0 max-w-full">
      {children}
    </div>
  );
}
