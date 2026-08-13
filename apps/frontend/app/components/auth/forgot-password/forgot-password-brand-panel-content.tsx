import Image from 'next/image';

/**
 * Renders a restrained login-specific brand reminder inside the shared desktop panel.
 *
 * @returns A decorative resume-tailoring illustration with concise returning-user copy.
 */
export function ForgotPasswordBrandPanelContent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-8">
      <div
        aria-hidden="true"
        className="auth-forgot-password-illustration flex justify-center pt-8"
      >
        <Image
          src="/images/auth/forgot-password-illustration.webp"
          alt=""
          width={368}
          height={368}
          loading="eager"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
          Forgot your password?
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-white/75">
          No worries. We&apos;ll send you a reset code to your email so you can
          get back into your account.
        </p>
      </div>
    </div>
  );
}
