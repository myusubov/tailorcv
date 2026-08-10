/**
 * Renders a familiar login-specific resume reminder inside the shared desktop brand panel.
 *
 * @returns A decorative resume preview with concise returning-user copy.
 */
export function LoginBrandPanelContent() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-10">
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-xs rounded-2xl bg-white/10"
      >
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-7 text-zinc-900">
          <div className="text-center">
            <div className="mx-auto h-2.5 w-24 rounded-full bg-zinc-700" />
            <div className="mx-auto mt-2 h-1.5 w-32 rounded-full bg-zinc-200" />
          </div>

          <div className="mt-7 space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Experience
                </span>
                <span className="flex-1 border-t border-zinc-200" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-2/5 rounded-full bg-zinc-200" />
                <div className="h-1.5 w-full rounded-full bg-zinc-100" />
                <div className="h-1.5 w-4/5 rounded-full bg-zinc-100" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Projects
                </span>
                <span className="flex-1 border-t border-zinc-200" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-1/3 rounded-full bg-zinc-200" />
                <div className="h-1.5 w-11/12 rounded-full bg-zinc-100" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Skills
                </span>
                <span className="flex-1 border-t border-zinc-200" />
              </div>
              <div className="mt-3 flex gap-2">
                <span className="h-6 flex-1 rounded-md bg-zinc-100" />
                <span className="h-6 flex-1 rounded-md bg-zinc-100" />
                <span className="h-6 flex-1 rounded-md bg-zinc-100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
          Welcome back.
        </h2>
        <p className="max-w-sm text-base leading-relaxed text-white/75">
          Your resume is ready when you are.
        </p>
      </div>
    </div>
  );
}
