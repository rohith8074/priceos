'use client';

import { Building2 } from 'lucide-react';
import Link from 'next/link';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Branding */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="font-semibold">PriceOS</span>
          </div>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <span>© {currentYear} PriceOS. All rights reserved.</span>
            <span className="hidden md:inline text-border">|</span>
            <Link href="/login" className="hover:text-foreground transition-colors font-medium">
              Member Login
            </Link>
          </div>

          {/* Attribution */}
          <div className="text-center md:text-right">
            Powered by{' '}
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Neon Auth
            </a>{' '}
            +{' '}
            <a
              href="https://lyzr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Lyzr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
