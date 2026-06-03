'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { FileSignature } from 'lucide-react';

export function PublicNav() {
  const { user } = useAuth();
  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileSignature className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-slate-900">DigSign</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
          <Link href="/verify" className="hover:text-slate-900">
            Verify document
          </Link>
          {user ? (
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="hover:text-slate-900">
              Sign in
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
