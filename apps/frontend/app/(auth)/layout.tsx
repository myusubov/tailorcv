import { redirectIfSignedIn } from '@/lib/auth/guards';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await redirectIfSignedIn();

  return children;
}
