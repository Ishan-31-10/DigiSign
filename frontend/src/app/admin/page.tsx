'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import useSWR from '@/lib/useSWR';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, statusColor } from '@/lib/utils';
import type { DocumentDoc, User } from '@/lib/types';

type Stats = {
  counts: { users: number; docs: number; signed: number; drafts: number; audits: number };
  recentDocs: (DocumentDoc & { owner: { name: string; email: string } })[];
  recentUsers: User[];
};

export default function AdminOverview() {
  const { data, loading } = useSWR<Stats>('/admin/stats');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin overview</h1>
        <p className="text-sm text-slate-500">Operational snapshot of the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={data?.counts.users ?? 0} />
        <Stat icon={<FileText className="h-5 w-5" />} label="Documents" value={data?.counts.docs ?? 0} />
        <Stat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Signed"
          value={data?.counts.signed ?? 0}
          tone="emerald"
        />
        <Stat icon={<Clock className="h-5 w-5" />} label="Drafts" value={data?.counts.drafts ?? 0} tone="amber" />
        <Stat icon={<Activity className="h-5 w-5" />} label="Audit events" value={data?.counts.audits ?? 0} tone="sky" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent documents</h2>
            <Link href="/admin/documents" className="text-xs font-medium text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <CardBody className="p-0">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(data?.recentDocs || []).map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{d.originalName}</p>
                      <p className="text-xs text-slate-500">
                        {d.owner?.email || '—'} · {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  </li>
                ))}
                {!loading && !(data?.recentDocs || []).length && (
                  <li className="px-5 py-8 text-center text-sm text-slate-500">No documents yet.</li>
                )}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent users</h2>
            <Link href="/admin/users" className="text-xs font-medium text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {(data?.recentUsers || []).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.role}</Badge>
                    <Badge
                      className={
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }
                    >
                      {u.status}
                    </Badge>
                  </div>
                </li>
              ))}
              {!loading && !(data?.recentUsers || []).length && (
                <li className="px-5 py-8 text-center text-sm text-slate-500">No users yet.</li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({
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
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  } as const;
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
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
