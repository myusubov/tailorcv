/**
 * Checks if a value is a plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Deep-merge two JSON-like values.
 * - Plain objects are merged recursively
 * - Arrays are replaced (not merged)
 * - `null` deletes keys (object merge only)
 * - Primitives are replaced
 */
export function deepMerge<T>(target: T, patch: unknown): T {
  if (!isPlainObject(target) || !isPlainObject(patch)) {
    return (patch as T) ?? target;
  }

  const result: Record<string, unknown> = { ...(target as any) };

  for (const [key, patchValue] of Object.entries(patch)) {
    // If patch value is null, delete key
    if (patchValue === null) {
      delete result[key];
      continue;
    }

    const targetValue = (result as any)[key];

    // Arrays are replaced, not merged
    if (Array.isArray(patchValue)) {
      result[key] = patchValue;
      continue;
    }

    // Recursively merge objects
    if (isPlainObject(targetValue) && isPlainObject(patchValue)) {
      result[key] = deepMerge(targetValue, patchValue);
      continue;
    }

    // Primitives/catch-all replace
    result[key] = patchValue;
  }

  return result as T;
}
