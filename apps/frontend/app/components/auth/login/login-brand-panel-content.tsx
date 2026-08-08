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
        className="mx-auto w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-3"
      >
        <div className="border-border bg-surface text-surface-foreground rounded-xl border px-6 py-7">
          <div className="text-center">
            <div className="bg-surface-foreground/80 mx-auto h-2.5 w-24 rounded-full" />
            <div className="bg-default mx-auto mt-2 h-1.5 w-32 rounded-full" />
          </div>

          <div className="mt-7 space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Experience
                </span>
                <span className="border-separator flex-1 border-t" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="bg-default h-2 w-2/5 rounded-full" />
                <div className="bg-default-soft h-1.5 w-full rounded-full" />
                <div className="bg-default-soft h-1.5 w-4/5 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Projects
                </span>
                <span className="border-separator flex-1 border-t" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="bg-default h-2 w-1/3 rounded-full" />
                <div className="bg-default-soft h-1.5 w-11/12 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Skills
                </span>
                <span className="border-separator flex-1 border-t" />
              </div>
              <div className="mt-3 flex gap-2">
                <span className="bg-default-soft h-6 flex-1 rounded-md" />
                <span className="bg-default-soft h-6 flex-1 rounded-md" />
                <span className="bg-default-soft h-6 flex-1 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
          Welcome back.
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-white/75">
          Your resume is ready when you are.
        </p>
      </div>
    </div>
  );
}
