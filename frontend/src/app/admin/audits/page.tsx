'use client';

import { useState } from 'react';
import useSWR from '@/lib/useSWR';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

const ACTION_FILTERS = [
  'user.login',
  'user.login_failed',
  'user.register',
  'user.password_reset_requested',
  'user.password_reset_completed',
  'user.password_changed',
  'document.upload',
  'document.sign',
  'document.delete',
  'document.download',
  'document.verify',
  'signature.create',
  'signature.delete',
  'admin.user_update',
];

export default function AdminAuditsPage() {
  const [action, setAction] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = `/admin/audits?page=${page}&limit=${limit}${action ? `&action=${action}` : ''}`;
  const { data, loading } = useSWR<{ items: AuditLog[]; total: number; page: number; limit: number }>(
    query,
    [query]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500">
          Append-only record of all important actions across the platform.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setAction('');
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                action === ''
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs"
            >
              <option value="">Filter by action…</option>
              {ACTION_FILTERS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-500">
            {data?.total ?? 0} events
          </div>
        </div>
        <CardBody className="p-0">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Actor</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3 hidden md:table-cell">Target</th>
                    <th className="px-5 py-3 hidden lg:table-cell">IP</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.items || []).map((a) => (
                    <tr key={a._id}>
                      <td className="px-5 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                      <td className="px-5 py-3">
                        {a.actor ? (
                          <>
                            <p className="text-sm text-slate-900">{a.actor.name}</p>
                            <p className="text-xs text-slate-500">{a.actor.email}</p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">{a.actorEmail || 'system'}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">{a.action}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 hidden md:table-cell">
                        {a.targetType && (
                          <>
                            {a.targetType}
                            {a.targetId && <span className="text-slate-400"> · {String(a.targetId).slice(-6)}</span>}
                          </>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 hidden lg:table-cell font-mono">
                        {a.ip}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          className={
                            a.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {!loading && !(data?.items || []).length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                        No audit events.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
