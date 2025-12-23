export function stageToLabel(stage?: string) {
  switch (stage) {
    case 'QUEUED':
      return 'Queued…';
    case 'CALLING_AI':
      return 'Generating with AI…';
    case 'RETRYING':
      return 'Refining output…';
    case 'VALIDATING':
      return 'Validating resume data…';
    case 'SAVING':
      return 'Saving your resume…';
    case 'DONE':
      return 'Finalizing…';
    default:
      return null;
  }
}

export function clampProgressPct(progressPct?: number) {
  if (typeof progressPct !== 'number' || !Number.isFinite(progressPct))
    return null;
  return Math.max(0, Math.min(100, Math.round(progressPct)));
}

export function reassuranceFromElapsedMs(elapsedMs: number) {
  if (elapsedMs >= 30000)
    return 'Still working — we’re automatically shortening details so everything fits.';
  if (elapsedMs >= 10000)
    return 'Still working — larger profiles can take up to ~30 seconds.';
  return null;
}

