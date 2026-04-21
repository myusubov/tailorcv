'use client';

interface ResettableClerkAuthResource {
  reset?: () => Promise<unknown> | unknown;
}

/**
 * Clears Clerk's current sign-in or sign-up attempt before starting a new auth path.
 *
 * Clerk exposes `reset()` at runtime on its sign-in and sign-up resources, but the
 * future-resource typings used by the custom flow do not currently include it. Calling
 * it before OAuth avoids reusing a cancelled provider attempt when the user switches
 * from Google to Apple, or the reverse.
 */
export async function resetClerkAuthResource({
  resource,
}: {
  resource: unknown;
}) {
  const reset = (resource as ResettableClerkAuthResource | null)?.reset;

  if (typeof reset !== 'function') return;

  await reset.call(resource);
}
