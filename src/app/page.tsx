import { redirect } from 'next/navigation';

export default async function LandingPage() {
  // Always redirect to login for now as requested
  redirect('/login');
}
