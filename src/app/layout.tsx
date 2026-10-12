import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { RequestSecurityProvider } from '@/components/security/RequestSecurityProvider';
import { NavigationProgress } from '@/components/navigation/NavigationProgress';
import { PageTransition } from '@/components/navigation/PageTransition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F6F0' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0A0F' },
  ],
};

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'ZORY — Nền Tảng Đọc Truyện & Sáng Tác Văn Học AI',
    template: '%s | ZORY',
  },
  description:
    'Stories Beyond Imagination. Hệ sinh thái đọc truyện trực tuyến, sáng tác truyện với AI Studio và nghe truyện thông minh bằng Text-to-Speech chất lượng cao.',
  keywords: [
    'ZORY',
    'đọc truyện online',
    'sáng tác truyện AI',
    'sách nói',
    'tiên hiệp',
    'kiếm hiệp',
    'văn học',
  ],
  authors: [{ name: 'ZORY Platform' }],
  openGraph: {
    title: 'ZORY — Stories Beyond Imagination',
    description:
      'Đọc truyện, sáng tác cùng AI và trải nghiệm sách nói với giao diện Midnight Literary chuẩn mực.',
    url: 'https://zory.vn',
    siteName: 'ZORY',
    locale: 'vi_VN',
    type: 'website',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZORY',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${lora.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`min-h-screen flex flex-col bg-background text-text-primary antialiased selection:bg-secondary selection:text-primary ${inter.className}`}>
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <RequestSecurityProvider />
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
