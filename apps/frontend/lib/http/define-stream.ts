import type { CacheKeyPart } from './define-client-get';

export type DefineStreamConfig<TParams> = {
  path: string | ((params: TParams) => string);
  streamKey: string;
  staticKeys?: CacheKeyPart[];
  dynamicKeys?: (params: TParams) => CacheKeyPart[] | Promise<CacheKeyPart[]>;
};

export type StreamFn<TParams, TResponse> = {
  (params: TParams): string;
  config: DefineStreamConfig<TParams>;
};

export function defineStream<TParams = void, TResponse = any>(
  config: DefineStreamConfig<TParams>,
): StreamFn<TParams, TResponse> {
  const fn = (params: TParams) => {
    const path =
      typeof config.path === 'function'
        ? config.path(params)
        : config.path;
    return path;
  };

  return Object.assign(fn, { config });
}
