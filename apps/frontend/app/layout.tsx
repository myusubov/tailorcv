import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers/theme-provider';
import { QueryProvider } from './providers/query-provider';
import { AIChatProvider } from './providers/ai-chat-provider';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toast } from '@heroui/react';
import { ClientOnlyComponents } from './components/client-only-components';

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* ClerkProvider must be inside <body> in Clerk v7 for Next.js cache/PPR support */}
        <ClerkProvider
          afterSignOutUrl="/login"
          signInUrl="/login"
          signUpUrl="/register"
        >
          <NuqsAdapter>
            <ThemeProvider>
              <QueryProvider>
                <AIChatProvider>
                  <Toast.Provider placement="bottom end" />
                  <Suspense
                    fallback={
                      <div className="flex min-h-screen items-center justify-center">
                        Loading...
                      </div>
                    }
                  >
                    {children}
                  </Suspense>
                  <ClientOnlyComponents />
                  <Toaster richColors closeButton position="bottom-right" />
                </AIChatProvider>
              </QueryProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </ClerkProvider>
      </body>
    </html>
  );
}
