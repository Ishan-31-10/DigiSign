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
import { PublicNav } from '@/components/layout/PublicNav';

const schema = z
  .object({
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

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [submitting, setSubmitting] = useState(false);
  const invalid = !email || !token;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      await api('/auth/reset-password', {
        method: 'POST',
        body: { email, token, password: data.password },
      });
      toast.success('Password updated. Please sign in.');
      router.replace('/login');
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-600">
            {invalid ? 'Invalid reset link.' : `Resetting password for ${email}`}
          </p>
        </div>
        {invalid ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>This reset link is missing required parameters. Please request a new one.</p>
            <Link href="/forgot-password" className="mt-3 inline-block font-medium hover:underline">
              Request a new link →
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
          >
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" loading={submitting} className="w-full">
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}
