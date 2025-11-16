'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isDemoPage = pathname === '/demo';
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b ${
      isDemoPage 
        ? 'bg-white border-[color:var(--tone-border)]' 
        : 'border-[color:var(--tone-border)]/30 bg-[color:rgba(5,6,8,0.7)] backdrop-blur-xl backdrop-saturate-150'
    }`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <span className={`text-xs uppercase tracking-[0.4em] ${
              isDemoPage ? 'text-[color:var(--tone-dark)]/70' : 'text-[color:var(--tone-muted)]'
            }`}>
              polkadot
            </span>
            <span className={`text-2xl font-semibold tracking-tight ${
              isDemoPage ? 'text-[color:var(--tone-dark)]' : 'text-[color:var(--tone-light)]'
            }`}>
              x402
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-10">
            <Link
              href="/"
              className={`text-sm font-medium tracking-widest transition-colors ${
                isDemoPage
                  ? (pathname as string) === '/'
                    ? 'text-[color:var(--tone-dark)]'
                    : 'text-[color:var(--tone-dark)]/70 hover:text-[color:var(--tone-dark)]'
                  : pathname === '/'
                    ? 'text-[color:var(--tone-light)]'
                    : 'text-[color:var(--tone-muted)] hover:text-[color:var(--tone-light)]'
              }`}
            >
              Home
            </Link>
            <Link
              href="/demo"
              className={`text-sm font-medium tracking-widest transition-colors ${
                isDemoPage
                  ? pathname === '/demo'
                    ? 'text-[color:var(--tone-dark)]'
                    : 'text-[color:var(--tone-dark)]/70 hover:text-[color:var(--tone-dark)]'
                  : pathname === '/demo'
                    ? 'text-[color:var(--tone-light)]'
                    : 'text-[color:var(--tone-muted)] hover:text-[color:var(--tone-light)]'
              }`}
            >
              Demo
            </Link>
            <Link
              href="/docs"
              className={`text-sm font-medium tracking-widest transition-colors ${
                isDemoPage
                  ? (pathname as string) === '/docs'
                    ? 'text-[color:var(--tone-dark)]'
                    : 'text-[color:var(--tone-dark)]/70 hover:text-[color:var(--tone-dark)]'
                  : pathname === '/docs'
                    ? 'text-[color:var(--tone-light)]'
                    : 'text-[color:var(--tone-muted)] hover:text-[color:var(--tone-light)]'
              }`}
            >
              Documentation
            </Link>
            <Link
              href="/docs#api"
              className={`text-sm font-medium tracking-widest transition-colors ${
                isDemoPage
                  ? 'text-[color:var(--tone-dark)]/70 hover:text-[color:var(--tone-dark)]'
                  : 'text-[color:var(--tone-muted)] hover:text-[color:var(--tone-light)]'
              }`}
            >
              API
            </Link>
          </div>

          <Link
            href="/docs"
            className="btn btn-primary text-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

