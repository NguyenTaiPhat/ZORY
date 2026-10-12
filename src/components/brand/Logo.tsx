import React from 'react';

export interface LogoProps {
  variant?: 'symbol' | 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: { icon: 28, font: 'text-xl font-black', track: 'tracking-[0.12em]', subFont: 'text-[9px] font-extrabold', gap: 'gap-2.5' },
  md: { icon: 38, font: 'text-2xl font-black', track: 'tracking-[0.14em]', subFont: 'text-[10px] font-extrabold', gap: 'gap-3' },
  lg: { icon: 50, font: 'text-3xl font-black', track: 'tracking-[0.16em]', subFont: 'text-xs font-extrabold', gap: 'gap-3.5' },
  xl: { icon: 72, font: 'text-5xl font-black', track: 'tracking-[0.18em]', subFont: 'text-sm font-extrabold', gap: 'gap-4' },
};

export function Logo({
  variant = 'horizontal',
  size = 'md',
  showTagline = true,
  className = '',
  animate = true,
}: LogoProps) {
  const currentSize = sizeMap[size];

  // Modern AI Rounded Squircle Brandmark (100% Symmetrical Thick Z + Solid Rounded AI Sparkle Stars)
  const symbolIcon = (
    <div
      className={`relative flex items-center justify-center shrink-0 transition-all duration-300 ${
        animate ? 'group-hover:scale-105 group-hover:-translate-y-0.5' : ''
      }`}
      style={{ width: currentSize.icon, height: currentSize.icon }}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_14px_rgba(168,85,247,0.22)]"
      >
        <defs>
          {/* Flowing Spectrum Gradient for Thick Z */}
          <linearGradient id={`thick-z-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="28%" stopColor="#F43F5E" />
            <stop offset="60%" stopColor="#A855F7" />
            <stop offset="85%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* White Background Gradient */}
          <linearGradient id={`white-bg-grad-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>

          {/* Solid Rounded Star Gradient (Amber Gold) */}
          <linearGradient id={`star-round-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Solid Rounded Star Gradient (Cyan Glow) */}
          <linearGradient id={`cyan-star-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Pure White iOS Squircle Background with subtle border */}
        <rect
          x="20"
          y="20"
          width="472"
          height="472"
          rx="116"
          fill={`url(#white-bg-grad-${size})`}
          stroke="#E2E8F0"
          strokeWidth="3.5"
        />

        {/* Symmetrical Balanced Thick Rounded AI Glyph Z (166,146 -> 346,146 -> 166,366 -> 346,366) */}
        <g>
          <path
            d="M 166 146 L 346 146 L 166 366 L 346 366"
            fill="none"
            stroke={`url(#thick-z-grad-${size})`}
            strokeWidth="64"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Solid Rounded AI Star (Top Right - No Inner Hole, Rounded Tips & Edges) */}
        <g transform="translate(402, 110)">
          <path
            d="M -4 -22
               A 4 4 0 0 1 4 -22
               C 4.8 -7.2, 7.2 -4.8, 22 -4
               A 4 4 0 0 1 22 4
               C 7.2 4.8, 4.8 7.2, 4 22
               A 4 4 0 0 1 -4 22
               C -4.8 7.2, -7.2 4.8, -22 4
               A 4 4 0 0 1 -22 -4
               C -7.2 -4.8, -4.8 -7.2, -4 -22 Z"
            fill={`url(#star-round-grad-${size})`}
          />
        </g>

        {/* Solid Rounded AI Star (Bottom Left - No Inner Hole, Rounded Tips & Edges) */}
        <g transform="translate(110, 402)">
          <path
            d="M -3 -15
               A 3 3 0 0 1 3 -15
               C 3.6 -5.4, 5.4 -3.6, 15 -3
               A 3 3 0 0 1 15 3
               C 5.4 3.6, 3.6 5.4, 3 15
               A 3 3 0 0 1 -3 15
               C -3.6 5.4, -5.4 3.6, -15 3
               A 3 3 0 0 1 -15 -3
               C -5.4 -3.6, -3.6 -5.4, -3 -15 Z"
            fill={`url(#cyan-star-grad-${size})`}
          />
        </g>
      </svg>
    </div>
  );

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} aria-label="ZORY Logo">
        {symbolIcon}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${currentSize.gap} group ${className}`}>
        {symbolIcon}
        <div className="flex flex-col items-center">
          <span
            className={`font-display ${currentSize.font} ${currentSize.track} text-text-primary group-hover:text-primary transition-colors duration-200`}
          >
            ZORY
          </span>
          {showTagline && (
            <span
              className={`${currentSize.subFont} tracking-[0.24em] uppercase text-text-muted mt-0.5`}
            >
              Literary AI
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} group ${className}`}>
      {symbolIcon}
      <div className="flex items-center gap-2.5">
        <span
          className={`font-display ${currentSize.font} ${currentSize.track} text-text-primary group-hover:text-primary transition-colors duration-200`}
        >
          ZORY
        </span>
        {showTagline && (
          <>
            <div className="hidden sm:block h-3.5 w-[1.5px] bg-border-strong opacity-80" />
            <span
              className={`hidden sm:inline-block ${currentSize.subFont} tracking-[0.22em] uppercase text-text-muted`}
            >
              Literary AI
            </span>
          </>
        )}
      </div>
    </div>
  );
}
