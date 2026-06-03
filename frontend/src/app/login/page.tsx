'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';
import { PublicNav } from '@/components/layout/PublicNav';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      const res = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: data,
      });
      auth.login(res.token, res.user);
      toast.success('Welcome back!');
      router.replace(res.user.role === 'admin' ? next : next);
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Sign in to DigSign</h1>
          <p className="mt-1 text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Demo accounts</p>
          <p className="mt-1">User: <code>demo@digsign.local</code> / <code>Demo@12345</code></p>
          <p>Admin: <code>admin@digsign.local</code> / <code>Admin@12345</code></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
