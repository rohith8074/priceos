import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { LandingFooter } from '@/components/landing/landing-footer';

export default async function LandingPage() {
  // Check auth status, but don't block rendering if auth fails
  let session = null;
  try {
    const { data: session, error } = await auth.getSession();
  } catch (error) {
    // Auth check failed (network error, etc.) - render landing page anyway
    console.error('Auth check failed:', error);
  }

  // Redirect authenticated users directly to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <HeroSection />
      <FeaturesSection />
      <LandingFooter />
    </div>
  );
}
