import Image from 'next/image';

/**
 * Renders a restrained login-specific brand reminder inside the shared desktop panel.
 *
 * @returns A decorative resume-tailoring illustration with concise returning-user copy.
 */
export function LoginBrandPanelContent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-8">
      <div
        aria-hidden="true"
        className="auth-login-illustration flex justify-center pt-8"
      >
        <Image
          src="/images/auth/login-illustration.webp"
          alt=""
          width={368}
          height={368}
          loading="eager"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
          Welcome back.
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-white/75">
          Your resume is ready when you are.
        </p>
      </div>
    </div>
  );
}
