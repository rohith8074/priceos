import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { LandingFooter } from '@/components/landing/landing-footer';

export default async function LandingPage() {
  redirect('/dashboard');
}
