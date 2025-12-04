// app/posts/page.tsx
// This page demonstrates Next.js 16 Partial Prerendering (PPR)
// The static shell (heading/layout) is prerendered at build time
// Dynamic parts (UserGreeting, PostsList) stream in at request time
import { Suspense } from 'react';
import PostsList from './posts-list';
import UserGreeting from './user-greeting';
import { Skeleton } from '@heroui/react';

const BlogPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Static content - prerendered at build time */}
      <h1 className="mb-4 text-2xl font-bold">Posts</h1>

      {/* Dynamic content - streams in at request time */}
      <Suspense
        fallback={
          <div className="mb-4 h-12 animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-gray-800"></div>
        }
      >
        <UserGreeting />
      </Suspense>

      {/* Dynamic content boundary - streams in with cached data */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <PostsList />
      </Suspense>
    </div>
  );
};

export default BlogPage;
