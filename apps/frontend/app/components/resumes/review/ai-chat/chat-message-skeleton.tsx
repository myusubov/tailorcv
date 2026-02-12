import { Skeleton, cn } from '@heroui/react';

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            'flex w-full gap-3',
            i % 2 === 0 ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div
            className={cn(
              'flex max-w-[80%] flex-col gap-2',
              i % 2 === 0 ? 'items-end' : 'items-start',
            )}
          >
            <Skeleton
              className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-64')}
            />
            {i % 2 !== 0 && <Skeleton className="h-4 w-24 rounded-lg" />}
          </div>
        </div>
      ))}
    </div>
  );
}
