import Image from 'next/image';
import Link from 'next/link';

import { LOGOS } from '@/lib/config/constants';

type AuthLogoVariant = 'primary' | 'inverse' | 'monochrome';
type AuthLogoSize = 24 | 32 | 40 | 48 | 56 | 64;

interface AuthLogoProps {
  variant?: AuthLogoVariant;
  size?: AuthLogoSize;
  className?: string;
}

const AUTH_LOGO_SOURCE_BY_VARIANT: Record<AuthLogoVariant, string> = {
  primary: LOGOS.TAILORCV_PRIMARY,
  inverse: LOGOS.TAILORCV_INVERSE,
  monochrome: LOGOS.TAILORCV_MONOCHROME,
};

const AUTH_LOGO_TEXT_SIZE_CLASS_BY_SIZE: Record<AuthLogoSize, string> = {
  24: 'text-lg',
  32: 'text-xl',
  40: 'text-2xl',
  48: 'text-3xl',
  56: 'text-4xl',
  64: 'text-5xl',
};

/**
 * Renders the shared TailorCV mark and wordmark as an accessible home link.
 *
 * @param props - Contrast variant, supported display size, and optional layout classes.
 * @returns A branded link whose visible text supplies its accessible name.
 */
export function AuthLogo({
  variant = 'primary',
  size = 40,
  className = '',
}: AuthLogoProps) {
  const textSizeClass = AUTH_LOGO_TEXT_SIZE_CLASS_BY_SIZE[size];

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight transition-opacity hover:opacity-90 ${textSizeClass} ${className}`}
    >
      {/* The adjacent wordmark names the link, so the visual mark is decorative. */}
      <Image
        src={AUTH_LOGO_SOURCE_BY_VARIANT[variant]}
        alt=""
        width={size}
        height={size}
        unoptimized
      />
      <span className="sr-only lg:not-sr-only">TailorCV</span>
    </Link>
  );
}
