import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseSSOContinueFlow = vi.fn();

vi.mock('@/app/components/auth/sso-continue', () => ({
  SSOContinueForm: () => <div data-testid="sso-continue-form" />,
  useSSOContinueFlow: () => mockUseSSOContinueFlow(),
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
  it('returns null when Clerk sign-up state is unavailable', () => {
    mockUseSSOContinueFlow.mockReturnValue({
      signUp: null,
    });

    const { container } = render(<SSOContinuePage />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the continuation form and Clerk captcha when sign-up state exists', () => {
    mockUseSSOContinueFlow.mockReturnValue({
      signUp: { id: 'sign_up_123' },
      control: {},
      isSubmitting: false,
      globalError: '',
      handleSubmit: vi.fn(),
    });

    render(<SSOContinuePage />);

    expect(screen.getByTestId('sso-continue-form')).toBeTruthy();
    expect(document.querySelector('#clerk-captcha')).toBeTruthy();
  });
});
