import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LOGOS } from '@/lib/config/constants';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

import { AuthLogo } from './auth-logo';

describe('AuthLogo', () => {
  it('uses the primary mark by default and names the home link', () => {
    render(<AuthLogo />);

    const homeLink = screen.getByRole('link', { name: 'TailorCV' });
    const mark = homeLink.querySelector('img');

    expect(homeLink.getAttribute('href')).toBe('/');
    expect(mark?.getAttribute('src')).toBe(LOGOS.TAILORCV_PRIMARY);
    expect(mark?.getAttribute('alt')).toBe('');
  });

  it('uses the requested contrast variant and display size', () => {
    render(<AuthLogo variant="inverse" size={32} />);

    const mark = screen
      .getByRole('link', { name: 'TailorCV' })
      .querySelector('img');

    expect(mark?.getAttribute('src')).toBe(LOGOS.TAILORCV_INVERSE);
    expect(mark?.getAttribute('width')).toBe('32');
    expect(mark?.getAttribute('height')).toBe('32');
  });
});
