import { render, screen } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlobalLoading } from './global-loading';

interface MockSpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  size?: string;
}

vi.mock('@heroui/react', () => ({
  Spinner: (props: MockSpinnerProps) => (
    <span data-testid="loading-spinner" {...props} />
  ),
  cn: (...classNames: Array<string | undefined>) =>
    classNames.filter(Boolean).join(' '),
  useIsHydrated: () => true,
}));

afterEach(() => {
  document.body.style.overflow = '';
});

describe('GlobalLoading', () => {
  it('portals a customized accessible loading status directly into the body', async () => {
    const { container } = render(
      <GlobalLoading
        title="Checking your GitHub connection"
        description="This should only take a moment."
        className="custom-loading-class"
      />,
    );

    const status = await screen.findByRole('status');

    expect(container.childElementCount).toBe(0);
    expect(status.parentElement).toBe(document.body);
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(status.classList.contains('fixed')).toBe(true);
    expect(status.classList.contains('inset-0')).toBe(true);
    expect(status.classList.contains('z-100')).toBe(true);
    expect(status.classList.contains('custom-loading-class')).toBe(true);
    expect(
      screen.getByText('Checking your GitHub connection').textContent,
    ).toBe('Checking your GitHub connection');
    expect(
      screen.getByText('This should only take a moment.').textContent,
    ).toBe('This should only take a moment.');
    expect(
      screen.getByTestId('loading-spinner').getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('locks body scrolling while mounted and restores it after unmount', async () => {
    document.body.style.overflow = 'auto';

    const { unmount } = render(<GlobalLoading title="Loading" />);

    await screen.findByRole('status');
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
