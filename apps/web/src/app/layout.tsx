import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Providers } from '@/components/providers/providers';
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
  openGraph: {
    title: 'حرفينو | Harfino',
    description: 'منصة الحرفيين المصرية',
    type: 'website',
    locale: 'ar_EG',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-arabic antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <Providers>{children}</Providers>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
