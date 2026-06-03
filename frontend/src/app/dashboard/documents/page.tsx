'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from '@/lib/useSWR';
import toast from 'react-hot-toast';
import {
  FileText,
  Trash2,
  Download,
  ShieldCheck,
  Search,
  PenLine,
} from 'lucide-react';
import { Uploader } from '@/components/documents/Uploader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { api, downloadFile, ApiError } from '@/lib/api';
import type { DocumentDoc } from '@/lib/types';
import { formatBytes, formatDate, statusColor } from '@/lib/utils';

export default function DocumentsPage() {
  const { data, loading, refetch } = useSWR<{ documents: DocumentDoc[] }>('/documents');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'uploaded' | 'draft' | 'signed'>('all');
  const [toDelete, setToDelete] = useState<DocumentDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const docs = useMemo(() => {
    const list = data?.documents || [];
    return list
      .filter((d) => (filter === 'all' ? true : d.status === filter))
      .filter((d) =>
        q ? d.originalName.toLowerCase().includes(q.toLowerCase()) : true
      );
  }, [data, q, filter]);

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await api(`/documents/${toDelete._id}`, { method: 'DELETE' });
      toast.success('Document deleted');
      setToDelete(null);
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setDeleting(false);
    }
  };

  const onDownload = async (d: DocumentDoc) => {
    const variant = d.status === 'signed' ? 'signed' : 'original';
    try {
      await downloadFile(
        `/documents/${d._id}/file?variant=${variant}&disposition=attachment`,
        variant === 'signed' ? `signed-${d.originalName}` : d.originalName
      );
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My documents</h1>
        <p className="text-sm text-slate-500">
          Upload, sign and manage your PDF documents.
        </p>
      </div>

      <Uploader onUploaded={() => refetch()} />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'uploaded', 'draft', 'signed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <CardBody className="p-0">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
          ) : docs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No documents match"
              description="Try uploading a new PDF or changing your filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3 hidden md:table-cell">Size</th>
                    <th className="px-5 py-3 hidden md:table-cell">Pages</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Uploaded</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/documents/${d._id}`}
                              className="block truncate font-medium text-slate-900 hover:text-brand-700"
                            >
                              {d.originalName}
                            </Link>
                            {d.verificationId && (
                              <p className="font-mono text-xs text-slate-500">
                                ID: {d.verificationId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                        {formatBytes(d.sizeBytes)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                        {d.pageCount}
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={statusColor(d.status)}>{d.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {d.status === 'signed' ? (
                            <Link href={`/verify?id=${d.verificationId}`} target="_blank">
                              <Button variant="ghost" size="sm" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                                Verify
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/dashboard/documents/${d._id}/sign`}>
                              <Button variant="ghost" size="sm" leftIcon={<PenLine className="h-4 w-4" />}>
                                Sign
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download"
                            onClick={() => onDownload(d)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => setToDelete(d)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete document"
        description={`Are you sure you want to delete "${toDelete?.originalName}"? This cannot be undone.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={onDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Both the original and signed copies (if any) will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}
