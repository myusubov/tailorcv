import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockRedirect = vi.hoisted(() => vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('@/lib/config', () => ({
  config: {
    auth: {
      afterSignUpUrl: '/onboarding',
    },
  },
}));

const { default: SSOContinuePage } = await import('./page');

describe('SSOContinuePage', () => {
  it('redirects retired continuation visits back to registration', () => {
    expect(() => render(<SSOContinuePage />)).toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/register');
  });
});
