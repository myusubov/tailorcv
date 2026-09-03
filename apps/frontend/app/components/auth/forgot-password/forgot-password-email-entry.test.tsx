import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => tag,
    },
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

import { ForgotPasswordEmailEntry } from './forgot-password-email-entry';

describe('ForgotPasswordEmailEntry', () => {
  it('submits the entered email address through the controller callback', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ForgotPasswordEmailEntry onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Code' }));

    expect(onSubmit).toHaveBeenCalledWith('user@example.com');
  });
});
