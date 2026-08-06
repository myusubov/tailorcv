import { AuthLogo } from './auth-logo';

/**
 * Renders the desktop-only authentication brand panel with a decorative grid background.
 *
 * @returns The inset TailorCV brand surface used beside authentication forms.
 */
export const AuthBrandPanel = () => {
  return (
    <section className="hidden lg:flex lg:w-[clamp(27.5rem,42vw,47.5rem)] lg:shrink-0 lg:py-4 lg:ps-4">
      <div className="bg-primary relative w-full overflow-hidden rounded-2xl p-8 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]"
        />
        <div
          aria-hidden="true"
          className="bg-primary pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_95%)]"
        />

        <div className="relative z-20">
          <AuthLogo variant="inverse" />
        </div>
      </div>
    </section>
  );
};
