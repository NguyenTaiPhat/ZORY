'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleToggle = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-1.5 rounded-md border border-border bg-surface-elevated hover:border-text-primary text-text-secondary hover:text-text-primary transition interactive-press"
      title={`Đang dùng giao diện ${resolvedTheme === 'dark' ? 'Tối' : 'Sáng'}. Nhấn để đổi.`}
      aria-label="Chuyển chế độ sáng tối"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-text-primary" />
      )}
    </button>
  );
}
