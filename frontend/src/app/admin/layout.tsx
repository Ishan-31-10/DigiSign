'use client';

import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-sm text-slate-600">You need admin privileges to view this page.</p>
      </div>
    );
  }

  return <AppShell variant="admin">{children}</AppShell>;
}
