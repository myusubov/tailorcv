import type { ReactNode } from 'react';

import { AuthLogo } from './auth-logo';

interface AuthBrandPanelProps {
  children?: ReactNode;
}

/**
 * Renders the shared desktop-only authentication brand surface.
 *
 * @param props - Optional route-specific content rendered below the fixed logo.
 * @returns The inset TailorCV brand surface used beside authentication forms.
 */
export function AuthBrandPanel({ children }: AuthBrandPanelProps) {
  return (
    <section className="hidden lg:flex lg:w-122 lg:shrink-0 lg:py-4 lg:ps-4">
      <div className="bg-accent relative flex w-full flex-col overflow-hidden rounded-2xl p-8 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-size-[64px_64px] opacity-30"
        />
        <div
          aria-hidden="true"
          className="bg-accent pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,transparent_30%,black_95%)]"
        />

        <div className="absolute top-8 left-8 z-20">
          <AuthLogo variant="inverse" />
        </div>

        {children ? (
          <div className="relative z-10 flex flex-1 items-center py-8">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
