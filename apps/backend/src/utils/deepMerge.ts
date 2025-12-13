const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
};

/**
 * Deep-merge two JSON-like values.
 * - Plain objects are merged recursively
 * - Arrays are replaced (not merged)
 * - Primitives are replaced
 */
export const deepMerge = <T>(target: T, patch: unknown): T => {
  if (!isPlainObject(target) || !isPlainObject(patch)) {
    return (patch as T) ?? target;
  }

  const result: Record<string, unknown> = { ...(target as any) };

  for (const [key, patchValue] of Object.entries(patch)) {
    const targetValue = (result as any)[key];

    if (Array.isArray(patchValue)) {
      result[key] = patchValue;
      continue;
    }

    if (isPlainObject(targetValue) && isPlainObject(patchValue)) {
      result[key] = deepMerge(targetValue, patchValue);
      continue;
    }

    result[key] = patchValue;
  }

  return result as T;
};

