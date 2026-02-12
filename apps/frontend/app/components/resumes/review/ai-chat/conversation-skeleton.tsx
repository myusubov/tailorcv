import { Skeleton } from '@heroui/react';

export function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}
