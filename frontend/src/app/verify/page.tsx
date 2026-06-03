'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldX,
  Search,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, ApiError } from '@/lib/api';

type VerifyResult = {
  valid: boolean;
  verificationId?: string;
  documentHash?: string;
  originalName?: string;
  pageCount?: number;
  signedAt?: string;
  signedByName?: string;
  signedByEmail?: string;
  placements?: number;
  computedHash?: string;
};

function VerifyInner() {
  const params = useSearchParams();
  const initialId = params.get('id') || '';
  const [mode, setMode] = useState<'id' | 'file'>('id');
  const [vid, setVid] = useState(initialId);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runById = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<VerifyResult>(`/verify/${encodeURIComponent(id.trim())}`, {
        auth: false,
      });
      setResult(res);
    } catch (e) {
      setError((e as ApiError).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const runByFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<VerifyResult>('/verify', {
        method: 'POST',
        formData: fd,
        auth: false,
      });
      setResult(res);
    } catch (e) {
      setError((e as ApiError).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) runById(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Verify a document</h1>
          <p className="mt-2 text-sm text-slate-600">
            Look up a signed document by its verification ID, or upload the PDF to
            check its SHA-256 hash against our records.
          </p>
        </div>

        <Card className="mt-6">
          <div className="flex border-b border-slate-100 p-1">
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'id' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setMode('id')}
            >
              By verification ID
            </button>
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'file' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setMode('file')}
            >
              By file upload
            </button>
          </div>
          <CardBody>
            {mode === 'id' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runById(vid);
                }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Input
                    label="Verification ID"
                    placeholder="e.g. A92F73C19D4B"
                    value={vid}
                    onChange={(e) => setVid(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" loading={loading} leftIcon={<Search className="h-4 w-4" />}>
                  Verify
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runByFile(f);
                  }}
                />
                <p className="mb-3 text-sm text-slate-600">
                  Upload the signed PDF — we&apos;ll compute its SHA-256 and check our records.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => fileRef.current?.click()}
                  loading={loading}
                >
                  Choose PDF
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardBody>
              <p className="text-sm text-red-700">{error}</p>
            </CardBody>
          </Card>
        )}

        {loading && !result && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  if (!result.valid) {
    return (
      <Card className="mt-6 border-red-200">
        <CardBody className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldX className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="text-base font-semibold text-red-700">Document not verified</p>
            <p className="mt-1 text-slate-600">
              We could not find a signed document matching that input. The file may have
              been modified after signing, or it was not signed via DigSign.
            </p>
            {result.computedHash && (
              <p className="mt-3 text-xs">
                <span className="text-slate-500">Computed SHA-256:</span>{' '}
                <span className="font-mono break-all">{result.computedHash}</span>
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card className="mt-6 border-emerald-200">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-emerald-700">
              Document is authentic and signed via DigSign.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              The signature metadata matches our records.
            </p>
          </div>
        </div>
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <Field label="Verification ID" value={<span className="font-mono">{result.verificationId}</span>} />
          <Field label="Pages" value={result.pageCount} />
          <Field
            label="Original name"
            value={
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {result.originalName}
              </span>
            }
          />
          <Field label="Placements" value={result.placements} />
          <Field label="Signed by" value={result.signedByName} />
          <Field label="Signed at" value={result.signedAt && new Date(result.signedAt).toLocaleString()} />
          <Field label="Signer email" value={result.signedByEmail} />
          <Field
            label="Document hash"
            value={<span className="font-mono break-all text-xs">{result.documentHash}</span>}
            full
          />
          {result.computedHash && (
            <Field
              label="Computed hash"
              value={<span className="font-mono break-all text-xs">{result.computedHash}</span>}
              full
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-slate-900">{value ?? '—'}</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
