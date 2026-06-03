'use client';

import Link from 'next/link';
import useSWR from '@/lib/useSWR';
import { api } from '@/lib/api';
import type { DocumentDoc } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth-context';
import { formatBytes, formatDate, statusColor } from '@/lib/utils';
import {
  FileText,
  Upload,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileSignature,
} from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { data, loading } = useSWR<{ documents: DocumentDoc[] }>('/documents');
  const docs = data?.documents || [];

  const total = docs.length;
  const signed = docs.filter((d) => d.status === 'signed').length;
  const drafts = docs.filter((d) => d.status === 'draft').length;
  const uploaded = docs.filter((d) => d.status === 'uploaded').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500">Here&apos;s a snapshot of your documents.</p>
        </div>
        <Link href="/dashboard/documents">
          <Button leftIcon={<Upload className="h-4 w-4" />}>Upload document</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Total" value={total} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Signed" value={signed} tone="emerald" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Drafts" value={drafts} tone="amber" />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Uploaded" value={uploaded} tone="sky" />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent documents</h2>
          <Link
            href="/dashboard/documents"
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
          ) : docs.length === 0 ? (
            <EmptyState
              icon={<FileSignature className="h-5 w-5" />}
              title="No documents yet"
              description="Upload a PDF to get started with electronic signing."
              action={
                <Link href="/dashboard/documents">
                  <Button leftIcon={<Upload className="h-4 w-4" />}>Upload document</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {docs.slice(0, 6).map((d) => (
                <li key={d._id} className="flex items-center justify-between py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {d.originalName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(d.sizeBytes)} · {d.pageCount} pages · {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                    <Link
                      href={`/dashboard/documents/${d._id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'brand' | 'emerald' | 'amber' | 'sky';
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  } as const;
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
