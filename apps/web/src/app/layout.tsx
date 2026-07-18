import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Cairo } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Providers } from '@/components/providers/providers';
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: {
    default: 'حرفينو | Harfino',
    template: '%s | حرفينو',
  },
  description: 'منصة الحرفيين المصرية — ابحث عن حرفي موثوق في منطقتك',
  keywords: ['حرفينو', 'حرفيين', 'نجار', 'سباك', 'كهربائي', 'مصر'],
  authors: [{ name: 'Ahmed Shawky' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'حرفينو',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'حرفينو | Harfino',
    description: 'منصة الحراليين المصرية',
    type: 'website',
    locale: 'ar_EG',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#047857' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-arabic antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <Providers>{children}</Providers>
          </QueryProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
