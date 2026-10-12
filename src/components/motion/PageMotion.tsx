'use client';

import React, { useEffect, useRef } from 'react';

const REVEAL_SELECTOR =
  'section, article, form, [data-motion-card], .grid > a.group, .grid > div.group';

export function PageMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.dataset.motionReady = 'true';
    const items = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

    items.forEach((item, index) => {
      item.classList.add('motion-reveal');
      item.style.setProperty('--motion-delay', `${Math.min(index * 45, 360)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('motion-reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="motion-page animate-page-enter flex-1 flex flex-col w-full min-w-0 max-w-full">
      {children}
    </div>
  );
}
