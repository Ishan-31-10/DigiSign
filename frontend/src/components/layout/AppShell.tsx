'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  FileSignature,
  LayoutDashboard,
  FileText,
  PenLine,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const userLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/signatures', label: 'Signatures', icon: PenLine },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/audits', label: 'Audit log', icon: Activity },
];

export function AppShell({
  children,
  variant = 'user',
}: {
  children: React.ReactNode;
  variant?: 'user' | 'admin';
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = variant === 'admin' ? adminLinks : userLinks;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileSignature className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold text-slate-900">DigSign</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {variant === 'admin' && (
          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            <ShieldCheck className="h-3 w-3" /> Admin console
          </div>
        )}

        <nav className="mt-6 space-y-1">
          {links.map((l) => {
            // The overview / index link should only highlight on an exact match,
            // otherwise it stays highlighted on every nested route.
            const isIndex = l.href === '/dashboard' || l.href === '/admin';
            const active = isIndex
              ? pathname === l.href
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-4">
          {variant === 'user' && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin console
            </Link>
          )}
          {variant === 'admin' && (
            <Link
              href="/dashboard"
              className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to dashboard
            </Link>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">DigSign</span>
          <button
            onClick={logout}
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 lg:flex">
          <div className="hidden text-sm text-slate-500 lg:block">
            Signed in as <span className="font-medium text-slate-900">{user?.email}</span>
          </div>
          <div className="hidden text-xs text-slate-500 lg:block">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {user?.role}
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
