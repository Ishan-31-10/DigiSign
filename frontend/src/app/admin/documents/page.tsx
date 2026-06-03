'use client';

import Link from 'next/link';
import useSWR from '@/lib/useSWR';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DocumentDoc, User } from '@/lib/types';
import { formatBytes, formatDate, statusColor } from '@/lib/utils';

type DocWithOwner = DocumentDoc & { owner: User };

export default function AdminDocumentsPage() {
  const { data, loading } = useSWR<{ documents: DocWithOwner[] }>('/admin/documents');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All documents</h1>
        <p className="text-sm text-slate-500">Every document uploaded to the platform.</p>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden md:table-cell">Size</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Created</th>
                    <th className="px-5 py-3">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.documents || []).map((d) => (
                    <tr key={d._id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{d.originalName}</p>
                        <p className="text-xs text-slate-500">{d.pageCount} pages</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-slate-900">{d.owner?.name}</p>
                        <p className="text-xs text-slate-500">{d.owner?.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={statusColor(d.status)}>{d.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                        {formatBytes(d.sizeBytes)}
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {d.verificationId ? (
                          <Link
                            href={`/verify?id=${d.verificationId}`}
                            target="_blank"
                            className="font-mono text-xs text-brand-700 hover:underline"
                          >
                            {d.verificationId}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && !(data?.documents || []).length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                        No documents.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
