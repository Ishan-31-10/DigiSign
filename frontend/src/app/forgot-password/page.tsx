'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { PublicNav } from '@/components/layout/PublicNav';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      const res = await api<{ resetUrl?: string } | null>('/auth/forgot-password', {
        method: 'POST',
        body: data,
      });
      setSent(true);
      if (res?.resetUrl) setDevLink(res.resetUrl);
      toast.success('If that email exists, a reset link has been generated.');
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and we&apos;ll generate a reset link.
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
          <Button type="submit" loading={submitting} className="w-full">
            Send reset link
          </Button>
          <Link
            href="/login"
            className="block text-center text-xs text-brand-600 hover:underline"
          >
            Back to sign in
          </Link>
        </form>

        {sent && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1">
              If an account exists for the email you entered, a password reset link has been generated.
            </p>
            {devLink && (
              <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3 text-xs">
                <p className="mb-1 font-medium text-slate-700">
                  Development mode — reset URL:
                </p>
                <a href={devLink} className="break-all text-brand-700 hover:underline">
                  {devLink}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
