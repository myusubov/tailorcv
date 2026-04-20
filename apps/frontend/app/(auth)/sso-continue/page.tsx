import { redirect } from 'next/navigation';

/**
 * Redirects retired SSO continuation visits back to registration.
 * Account profile names are no longer collected by TailorCV auth flows, so
 * OAuth callbacks should finalize directly or surface configuration drift there.
 */
export default function SSOContinuePage() {
  return redirect('/register');
}
