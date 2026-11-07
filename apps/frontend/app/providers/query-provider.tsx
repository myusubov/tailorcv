'use client';

import {
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorCode } from 'shared';

import { buildLoginUrl } from '@/lib/auth/login-auth-reason';

function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === ErrorCode.UNAUTHORIZED
  );
}

// Only the full page load from the redirect below resets this; a soft
// navigation would leave it set and block later redirects.
let hasRedirectedToLogin = false;

function handleGlobalError(error: unknown) {
  if (!isUnauthorizedError(error) || hasRedirectedToLogin) return;

  hasRedirectedToLogin = true;
  window.location.href = buildLoginUrl({ reason: 'session_expired' });
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleGlobalError }),
    mutationCache: new MutationCache({ onError: handleGlobalError }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
    </QueryClientProvider>
  );
}
