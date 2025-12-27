/**
 * Deeply traverses an object to find strings that look like YYYY dates 
 * and normalizes them to YYYY-MM (e.g. "2021" becomes "2021-01").
 */
export function fixAiDateLaziness(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => fixAiDateLaziness(item));
  }

  const data = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(data)) {
    const val = data[key];

    // Look for string values that are exactly 4 digits (YYYY)
    // and keys that hint at dates (date, year)
    const isYearString = typeof val === 'string' && /^\d{4}$/.test(val);
    const looksLikeDateKey = key.toLowerCase().includes('date') || key.toLowerCase().includes('year');

    if (isYearString && looksLikeDateKey) {
      result[key] = `${val}-01`;
    } else if (val && typeof val === 'object') {
      result[key] = fixAiDateLaziness(val);
    } else {
      result[key] = val;
    }
  }

  return result;
}
