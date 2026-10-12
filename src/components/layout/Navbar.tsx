'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  User as UserIcon,
  LogOut,
  Shield,
  Bookmark,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

interface UserSession {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide global navbar on immersive reading mode to prevent header collisions
  if (pathname?.startsWith('/read/')) {
    return null;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { label: 'Khám phá', href: '/explore' },
    { label: 'Thể loại', href: '/genres' },
    { label: 'Sáng tác AI', href: '/studio' },
    { label: 'Nghe truyện', href: '/listen' },
    { label: 'Tủ sách', href: '/library' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Imprint */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display font-black text-2xl tracking-[0.18em] text-text-primary group-hover:text-primary transition duration-150">
              ZORY
            </span>
            <div className="hidden sm:block h-4 w-[1px] bg-border-strong" />
            <span className="hidden sm:block text-[10px] tracking-[0.18em] uppercase font-bold text-text-muted">
              Literary AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition relative ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search, Utilities & Account */}
        <div className="flex items-center gap-3">
          {/* Minimal Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center relative w-56 md:w-64"
          >
            <Search className="w-3.5 h-3.5 absolute left-3 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tác phẩm, tác giả..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition"
            />
          </form>

          {/* Theme switcher */}
          <ThemeToggle />

          {/* User Account State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-md border border-border bg-surface-elevated hover:border-text-primary transition"
                title="Tài khoản cá nhân"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || user.username}
                    className="w-6 h-6 rounded-sm object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-[11px]">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-text-primary max-w-[90px] truncate">
                  {user.name || user.username}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-surface border border-border shadow-xl py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-border">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-secondary uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-primary hover:bg-surface-elevated font-medium"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  <Link
                    href="/library"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-primary hover:bg-surface-elevated font-medium"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-text-muted" />
                    <span>Tủ sách của tôi</span>
                  </Link>

                  <Link
                    href="/studio"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-primary hover:bg-surface-elevated font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>ZORY AI Studio</span>
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-surface-elevated font-bold"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Trang Quản trị</span>
                    </Link>
                  )}

                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-error hover:bg-surface-elevated font-medium text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-bold rounded-md bg-text-primary text-background hover:opacity-90 transition shadow-sm"
              >
                Gia nhập
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md border border-border text-text-secondary hover:text-text-primary"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tác phẩm..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-elevated border border-border rounded-md text-text-primary"
            />
          </form>

          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-xs font-semibold ${
                  isActive
                    ? 'bg-surface-elevated text-text-primary font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {!user && (
            <div className="pt-3 border-t border-border flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-semibold rounded-md border border-border text-text-primary hover:bg-surface-elevated transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-bold rounded-md bg-text-primary text-background hover:opacity-90 transition shadow-sm"
              >
                Gia nhập
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
