import Image from 'next/image';

/**
 * Renders register-specific brand storytelling inside the shared desktop panel.
 *
 * @returns A decorative resume illustration with concise new-user copy.
 */
export function RegisterBrandPanelContent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-8">
      <div
        aria-hidden="true"
        className="auth-register-illustration flex justify-center pt-8"
      >
        <Image
          src="/images/auth/register-illustration.webp"
          alt=""
          width={368}
          height={368}
          loading="eager"
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
          Start with your story.
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-pretty text-white/75">
          Turn your experience into a resume made for the opportunity ahead.
        </p>
      </div>
    </div>
  );
}
