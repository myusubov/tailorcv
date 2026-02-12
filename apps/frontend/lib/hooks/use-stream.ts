import { useEffect, useState, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import { StreamFn } from '../http/define-stream';

export type UseStreamOptions<TResponse> = {
  enabled?: boolean;
  onData?: (data: TResponse) => void;
  onError?: (error: any) => void;
};

export function useStream<TParams, TResponse>(
  streamFn: StreamFn<TParams, TResponse>,
  params: TParams,
  options: UseStreamOptions<TResponse> = {},
) {
  const { enabled = true, onData, onError } = options;
  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to stable-ize options to avoid effect re-runs
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!enabled) return;

    const path = streamFn(params);
    const abortController = new AbortController();

    const connect = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchEventSource(path, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
          onmessage(ev) {
            if (ev.data) {
              try {
                const parsedData = JSON.parse(ev.data) as TResponse;
                setData(parsedData);
                optionsRef.current.onData?.(parsedData);
              } catch (err) {
                console.error('Failed to parse SSE data', err);
              }
            }
          },
          onerror(err) {
            setError(err);
            optionsRef.current.onError?.(err);
            // Return undefined to let fetch-event-source handle retry
          },
          onclose() {
            setIsLoading(false);
          },
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err);
          optionsRef.current.onError?.(err);
        }
        setIsLoading(false);
      }
    };

    connect();

    return () => {
      abortController.abort();
    };
  }, [enabled, params, streamFn]);

  return {
    data,
    error,
    isLoading,
  };
}
