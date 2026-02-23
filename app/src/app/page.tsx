import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { LandingFooter } from '@/components/landing/landing-footer';

export default async function LandingPage() {
  const session = await auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>
      <LandingFooter />
    </div>
  );
}
