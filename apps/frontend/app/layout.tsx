import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers/theme-provider';
import { QueryProvider } from './providers/query-provider';
import { ThemeToggle } from './components/theme-toggle';
import { Toaster } from 'sonner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TailorCV | Smart Resume Builder',
  description: 'AI-powered resume tailoring for developers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/login">
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`}>
          <ThemeProvider>
            <QueryProvider>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center">
                    Loading...
                  </div>
                }
              >
                {children}
              </Suspense>
              <ThemeToggle />
              <Toaster richColors closeButton position="bottom-right" />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
