import { headers } from 'next/headers';

// This component accesses request-time data (headers)
// It's wrapped in Suspense, so it streams in dynamically while the shell is static
export default async function UserGreeting() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  const timestamp = new Date().toLocaleTimeString();
  return (
    <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
      <p className="text-sm">
        Request time: {timestamp} | Browser:{' '}
        {userAgent.includes('Chrome')
          ? 'Chrome'
          : userAgent.includes('Safari')
            ? 'Safari'
            : 'Other'}
      </p>
    </div>
  );
}
