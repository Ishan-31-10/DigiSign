'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  PenLine,
  ShieldCheck,
  FileText,
  Loader2,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PdfPreview } from '@/components/documents/PdfPreview';
import useSWR from '@/lib/useSWR';
import { API_URL, downloadFile, getToken } from '@/lib/api';
import type { DocumentDoc } from '@/lib/types';
import { formatBytes, formatDate, statusColor } from '@/lib/utils';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading } = useSWR<{ document: DocumentDoc }>(`/documents/${id}`);
  const doc = data?.document;

  const fileUrl = useMemo(() => {
    if (!doc) return '';
    const variant = doc.status === 'signed' ? 'signed' : 'original';
    return `${API_URL.replace(/\/$/, '')}/documents/${doc._id}/file?variant=${variant}`;
  }, [doc]);

  if (loading || !doc) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  const downloadOriginal = () =>
    downloadFile(`/documents/${id}/file?variant=original&disposition=attachment`, doc.originalName);
  const downloadSigned = () =>
    downloadFile(`/documents/${id}/file?variant=signed&disposition=attachment`, `signed-${doc.originalName}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" /> Back to documents
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold text-slate-900">{doc.originalName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge className={statusColor(doc.status)}>{doc.status}</Badge>
            <span>{formatBytes(doc.sizeBytes)}</span>
            <span>{doc.pageCount} pages</span>
            <span>Uploaded {formatDate(doc.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc.status !== 'signed' && (
            <Link href={`/dashboard/documents/${id}/sign`}>
              <Button leftIcon={<PenLine className="h-4 w-4" />}>
                {doc.status === 'draft' ? 'Resume signing' : 'Sign document'}
              </Button>
            </Link>
          )}
          {doc.status === 'signed' && (
            <Button leftIcon={<Download className="h-4 w-4" />} onClick={downloadSigned}>
              Download signed
            </Button>
          )}
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={downloadOriginal}>
            Download original
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="bg-slate-100 p-4 lg:p-6">
            <PdfPreview fileUrl={fileUrl} authToken={getToken()} />
          </CardBody>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <div className="border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Document info</h3>
            </div>
            <CardBody className="space-y-2 text-sm">
              <Row label="Name" value={<span className="break-all">{doc.originalName}</span>} icon={<FileText className="h-4 w-4" />} />
              <Row label="Size" value={formatBytes(doc.sizeBytes)} />
              <Row label="Pages" value={doc.pageCount} />
              <Row label="Status" value={<Badge className={statusColor(doc.status)}>{doc.status}</Badge>} />
              <Row label="Uploaded" value={formatDate(doc.createdAt)} />
            </CardBody>
          </Card>

          {doc.status === 'signed' && (
            <Card>
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Verification</h3>
              </div>
              <CardBody className="space-y-3 text-sm">
                <Row
                  label="Verification ID"
                  value={
                    <button
                      className="inline-flex items-center gap-1 font-mono text-brand-700 hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText(doc.verificationId!);
                        toast.success('Verification ID copied');
                      }}
                    >
                      {doc.verificationId} <Copy className="h-3 w-3" />
                    </button>
                  }
                />
                <Row
                  label="SHA-256"
                  value={<span className="font-mono break-all text-xs">{doc.documentHash}</span>}
                />
                <Row label="Signed by" value={doc.signedByName} />
                <Row label="Signed at" value={formatDate(doc.signedAt)} />
                <Link href={`/verify?id=${doc.verificationId}`} target="_blank">
                  <Button className="w-full" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                    Open public verification
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-right text-slate-900">{value ?? '—'}</span>
    </div>
  );
}
