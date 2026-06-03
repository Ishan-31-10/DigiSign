'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Uppercase letter required')
      .regex(/[a-z]/, 'Lowercase letter required')
      .regex(/\d/, 'Digit required'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      await api('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      });
      toast.success('Password updated');
      reset();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label="Name" value={user?.name} />
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={user?.role} />
          <Row label="Status" value={user?.status} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:max-w-md">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <div>
              <Button type="submit" loading={submitting}>
                Update password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || '—'}</span>
    </div>
  );
}
