'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, PenLine } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SignaturePad, type CreatedSignature } from '@/components/signatures/SignaturePad';
import useSWR from '@/lib/useSWR';
import { api, ApiError } from '@/lib/api';
import type { Signature } from '@/lib/types';

export default function SignaturesPage() {
  const { data, loading, refetch } = useSWR<{ signatures: Signature[] }>('/signatures');
  const sigs = data?.signatures || [];
  const [showPad, setShowPad] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const onSave = async (sig: CreatedSignature) => {
    try {
      await api('/signatures', {
        method: 'POST',
        body: {
          label: sig.label,
          type: sig.type,
          dataUrl: sig.type === 'draw' ? sig.dataUrl : undefined,
          text: sig.type === 'type' ? sig.text : undefined,
          fontFamily: sig.type === 'type' ? sig.fontFamily : undefined,
        },
      });
      toast.success('Signature saved');
      setShowPad(false);
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this signature?')) return;
    try {
      setDeleting(id);
      await api(`/signatures/${id}`, { method: 'DELETE' });
      toast.success('Signature deleted');
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My signatures</h1>
          <p className="text-sm text-slate-500">
            Reusable signatures you can apply to any document.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPad(true)}>
          New signature
        </Button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
          ) : sigs.length === 0 ? (
            <EmptyState
              icon={<PenLine className="h-5 w-5" />}
              title="No saved signatures"
              description="Create a reusable signature you can drop onto any document."
              action={<Button onClick={() => setShowPad(true)}>Create a signature</Button>}
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sigs.map((s) => (
                <li
                  key={s._id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-20 items-center justify-center rounded-lg bg-slate-50">
                    {s.type === 'draw' && s.dataUrl ? (
                      <img src={s.dataUrl} alt={s.label} className="max-h-16 object-contain" />
                    ) : (
                      <span
                        className="text-2xl text-slate-900"
                        style={{ fontFamily: s.fontFamily }}
                      >
                        {s.text}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.label}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{s.type}</p>
                    </div>
                    <button
                      onClick={() => onDelete(s._id)}
                      disabled={deleting === s._id}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showPad}
        onClose={() => setShowPad(false)}
        title="Create a signature"
        size="lg"
      >
        <SignaturePad
          onConfirm={onSave}
          onCancel={() => setShowPad(false)}
        />
      </Modal>
    </div>
  );
}
