'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';
import { PublicNav } from '@/components/layout/PublicNav';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(100),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/\d/, 'At least one digit'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
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
      const res = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: { name: data.name, email: data.email, password: data.password },
      });
      auth.login(res.token, res.user);
      toast.success('Account created');
      router.replace('/dashboard');
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || 'Could not register');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <Input
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Must include uppercase, lowercase and a number."
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...register('confirm')}
          />
          <Button type="submit" loading={submitting} className="w-full">
            Create account
          </Button>
          <p className="text-center text-xs text-slate-500">
            By signing up you agree to our terms of use.
          </p>
        </form>
      </div>
    </div>
  );
}
