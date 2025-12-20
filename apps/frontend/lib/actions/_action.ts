import { revalidatePath, revalidateTag } from 'next/cache';

import { backendRequest, type ApiResult } from '@/lib/api';
import { makeCacheTags, type CacheKeyPart } from '@/lib/data/_query';

export type DefineActionConfig<TInput> = {
  method: 'POST' | 'PATCH' | 'DELETE';
  path: string | ((input: TInput) => string);
  auth?: 'required' | 'optional' | 'none';
  keyPrefix?: string;
  staticParts?: CacheKeyPart[];
  dynamicParts?: (input: TInput) => CacheKeyPart[];
  revalidate?: {
    fromKey?: boolean;
    tags?: string[];
    paths?: string[];
  };
};

export function defineAction<TInput, TOutput>(
  config: DefineActionConfig<TInput>,
) {
  return async (input: TInput): Promise<ApiResult<TOutput>> => {
    const path =
      typeof config.path === 'function' ? config.path(input) : config.path;

    const keyTags = config.keyPrefix
      ? makeCacheTags(
          config.keyPrefix,
          ...(config.staticParts ?? []),
          ...(config.dynamicParts ? config.dynamicParts(input) : []),
        )
      : [];

    const result = await backendRequest<TOutput>(path, {
      method: config.method,
      auth: config.auth ?? 'required',
      body: input,
    });

    if (result.ok) {
      const tagsToRevalidate = [
        ...(config.revalidate?.fromKey ? keyTags : []),
        ...(config.revalidate?.tags ?? []),
      ];
      for (const tag of new Set(tagsToRevalidate))
        revalidateTag(tag, 'default');

      for (const pathToRevalidate of new Set(config.revalidate?.paths ?? [])) {
        revalidatePath(pathToRevalidate, 'page');
      }
    }

    return result;
  };
}
