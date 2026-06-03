'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Save,
  CheckCircle2,
  ArrowLeft,
  PenLine,
  Plus,
  Trash2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PdfPreview } from '@/components/documents/PdfPreview';
import { SignaturePad, type CreatedSignature } from '@/components/signatures/SignaturePad';
import { api, ApiError, API_URL, getToken } from '@/lib/api';
import type { DocumentDoc, Placement, Signature } from '@/lib/types';
import useSWR from '@/lib/useSWR';

type DraftPlacement = Placement & { tempId: string };

const DEFAULT_W = 0.22;
const DEFAULT_H = 0.07;

export default function SignDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: docResp, refetch } = useSWR<{ document: DocumentDoc }>(`/documents/${id}`);
  const { data: sigsResp, refetch: refetchSigs } =
    useSWR<{ signatures: Signature[] }>('/signatures');

  const doc = docResp?.document;
  const savedSigs = sigsResp?.signatures || [];

  const [activeSig, setActiveSig] = useState<CreatedSignature | null>(null);
  const [placements, setPlacements] = useState<DraftPlacement[]>([]);
  const [showPadModal, setShowPadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState<{
    verificationId: string;
    verifyUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!doc) return;
    setPlacements(
      (doc.placements || []).map((p, i) => ({ ...p, tempId: `${i}-${Math.random()}` }))
    );
  }, [doc]);

  const onPickSavedSig = (sig: Signature) => {
    if (sig.type === 'draw' && sig.dataUrl) {
      setActiveSig({ type: 'draw', dataUrl: sig.dataUrl, label: sig.label });
    } else if (sig.type === 'type' && sig.text) {
      setActiveSig({
        type: 'type',
        text: sig.text,
        fontFamily: sig.fontFamily || 'Helvetica',
        label: sig.label,
      });
    }
    toast.success(`Using "${sig.label}". Click on the document to place.`);
  };

  const onCreateSig = (sig: CreatedSignature) => {
    setActiveSig(sig);
    setShowPadModal(false);
    toast.success('Signature ready. Click on the document to place it.');
  };

  const onSaveSig = async (sig: CreatedSignature) => {
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
      await refetchSigs();
      setActiveSig(sig);
      setShowPadModal(false);
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  const onPageClick = (page: number, xRatio: number, yRatio: number) => {
    if (!activeSig) {
      toast('Pick or create a signature first', { icon: 'ℹ️' });
      return;
    }
    const placement: DraftPlacement = {
      tempId: `${Date.now()}-${Math.random()}`,
      page,
      xRatio: Math.max(0, Math.min(1 - DEFAULT_W, xRatio - DEFAULT_W / 2)),
      yRatio: Math.max(0, Math.min(1 - DEFAULT_H, yRatio - DEFAULT_H / 2)),
      widthRatio: DEFAULT_W,
      heightRatio: DEFAULT_H,
      type: activeSig.type,
      dataUrl: activeSig.type === 'draw' ? activeSig.dataUrl : undefined,
      text: activeSig.type === 'type' ? activeSig.text : undefined,
      fontFamily: activeSig.type === 'type' ? activeSig.fontFamily : undefined,
    };
    setPlacements((prev) => [...prev, placement]);
  };

  const removePlacement = (tempId: string) =>
    setPlacements((prev) => prev.filter((p) => p.tempId !== tempId));

  const updatePlacement = (tempId: string, patch: Partial<Placement>) =>
    setPlacements((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, ...patch } : p)));

  const sanitize = () =>
    placements.map(({ tempId, ...rest }) => ({
      ...rest,
      dataUrl: rest.dataUrl || undefined,
      text: rest.text || undefined,
      fontFamily: rest.fontFamily || undefined,
    }));

  const onSaveDraft = async () => {
    try {
      setSaving(true);
      await api(`/documents/${id}/placements`, {
        method: 'PUT',
        body: { placements: sanitize() },
      });
      toast.success('Draft saved');
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const onFinalize = async () => {
    if (!placements.length) {
      toast.error('Place at least one signature first.');
      return;
    }
    try {
      setFinalizing(true);
      const res = await api<{
        document: DocumentDoc;
        verificationId: string;
        verifyUrl: string;
      }>(`/documents/${id}/finalize`, {
        method: 'POST',
        body: { placements: sanitize() },
      });
      setFinalized({ verificationId: res.verificationId, verifyUrl: res.verifyUrl });
      toast.success('Document signed!');
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setFinalizing(false);
    }
  };

  const fileUrl = useMemo(() => {
    if (!doc) return '';
    const variant = doc.status === 'signed' ? 'signed' : 'original';
    return `${API_URL.replace(/\/$/, '')}/documents/${doc._id}/file?variant=${variant}`;
  }, [doc]);

  if (!doc) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  const alreadySigned = doc.status === 'signed';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" /> Back to documents
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold text-slate-900">{doc.originalName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge className={alreadySigned ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
              {doc.status}
            </Badge>
            <span>{doc.pageCount} pages</span>
            {doc.verificationId && (
              <span className="font-mono">ID: {doc.verificationId}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!alreadySigned && (
            <>
              <Button variant="outline" onClick={onSaveDraft} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Save draft
              </Button>
              <Button onClick={onFinalize} loading={finalizing} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                Finalize & sign
              </Button>
            </>
          )}
          {alreadySigned && (
            <Link href={`/verify?id=${doc.verificationId}`} target="_blank">
              <Button leftIcon={<ShieldCheck className="h-4 w-4" />}>View verification</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="bg-slate-100 p-4 lg:p-6">
            <PdfPreview
              fileUrl={fileUrl}
              authToken={getToken()}
              onPageClick={alreadySigned ? undefined : onPageClick}
              renderOverlay={(pageNumber, w, h) => (
                <PlacementsLayer
                  pageNumber={pageNumber}
                  width={w}
                  height={h}
                  placements={placements}
                  readonly={alreadySigned}
                  onChange={updatePlacement}
                  onRemove={removePlacement}
                />
              )}
            />
          </CardBody>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {!alreadySigned && (
            <>
              <Card>
                <div className="border-b border-slate-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Active signature</h3>
                  <p className="text-xs text-slate-500">Click on the PDF to place it.</p>
                </div>
                <CardBody>
                  {activeSig ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {activeSig.type === 'draw' ? (
                        <img
                          src={activeSig.dataUrl}
                          alt="Active signature"
                          className="max-h-16 mx-auto object-contain"
                        />
                      ) : (
                        <div className="text-center text-xl text-slate-900" style={{ fontFamily: activeSig.fontFamily }}>
                          {activeSig.text}
                        </div>
                      )}
                      <p className="mt-2 text-center text-xs text-slate-500">{activeSig.label}</p>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-500">
                      No signature selected.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setShowPadModal(true)}
                  >
                    Create new signature
                  </Button>
                </CardBody>
              </Card>

              <Card>
                <div className="border-b border-slate-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Saved signatures</h3>
                </div>
                <CardBody>
                  {savedSigs.length === 0 ? (
                    <p className="text-center text-xs text-slate-500">
                      You don&apos;t have any saved signatures yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {savedSigs.map((s) => (
                        <li key={s._id}>
                          <button
                            onClick={() => onPickSavedSig(s)}
                            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-brand-400 hover:bg-brand-50/40"
                          >
                            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-slate-50">
                              {s.type === 'draw' && s.dataUrl ? (
                                <img src={s.dataUrl} alt={s.label} className="max-h-8 object-contain" />
                              ) : (
                                <span className="text-sm text-slate-700" style={{ fontFamily: s.fontFamily }}>
                                  {s.text}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{s.label}</p>
                              <p className="text-xs text-slate-500">{s.type}</p>
                            </div>
                            <PenLine className="h-4 w-4 text-slate-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <div className="border-b border-slate-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Placed signatures ({placements.length})
                  </h3>
                </div>
                <CardBody>
                  {placements.length === 0 ? (
                    <p className="text-center text-xs text-slate-500">None yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {placements.map((p, idx) => (
                        <li
                          key={p.tempId}
                          className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50"
                        >
                          <span className="text-slate-700">
                            #{idx + 1} · page {p.page}
                          </span>
                          <button
                            onClick={() => removePlacement(p.tempId)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </>
          )}

          {alreadySigned && (
            <Card>
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Signature details</h3>
              </div>
              <CardBody className="space-y-2 text-sm">
                <Row label="Verification ID" value={<span className="font-mono">{doc.verificationId}</span>} />
                <Row
                  label="SHA-256"
                  value={<span className="font-mono break-all text-xs">{doc.documentHash}</span>}
                />
                <Row label="Signed by" value={doc.signedByName} />
                <Row label="Signed at" value={doc.signedAt && new Date(doc.signedAt).toLocaleString()} />
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={showPadModal}
        onClose={() => setShowPadModal(false)}
        title="Create a signature"
        description="Draw or type, then either use it now or save to your library."
        size="lg"
      >
        <SignaturePad
          onConfirm={onCreateSig}
          onConfirmAndSave={onSaveSig}
          onCancel={() => setShowPadModal(false)}
          showSaveOption
        />
      </Modal>

      <Modal
        open={!!finalized}
        onClose={() => {
          setFinalized(null);
          router.push(`/dashboard/documents/${id}`);
        }}
        title="Document signed successfully"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Link
              href={finalized ? `/verify?id=${finalized.verificationId}` : '#'}
              target="_blank"
            >
              <Button variant="outline">Open verification</Button>
            </Link>
            <Button
              onClick={() => {
                setFinalized(null);
                router.push(`/dashboard/documents/${id}`);
              }}
            >
              Done
            </Button>
          </div>
        }
      >
        {finalized && (
          <div className="space-y-3 text-sm">
            <p>Your document has been signed. Share this verification ID or link with anyone:</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
              {finalized.verificationId}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs break-all">
              {finalized.verifyUrl}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value || '—'}</span>
    </div>
  );
}

/**
 * Draggable / resizable rectangles for each placement on a given page.
 * Coordinates are kept normalized (0..1) so the data round-trips cleanly.
 */
function PlacementsLayer({
  pageNumber,
  width,
  height,
  placements,
  readonly,
  onChange,
  onRemove,
}: {
  pageNumber: number;
  width: number;
  height: number;
  placements: DraftPlacement[];
  readonly: boolean;
  onChange: (tempId: string, patch: Partial<Placement>) => void;
  onRemove: (tempId: string) => void;
}) {
  const pagePlacements = placements.filter((p) => p.page === pageNumber);

  return (
    <>
      {pagePlacements.map((p) => (
        <PlacementBox
          key={p.tempId}
          placement={p}
          width={width}
          height={height}
          readonly={readonly}
          onChange={(patch) => onChange(p.tempId, patch)}
          onRemove={() => onRemove(p.tempId)}
        />
      ))}
    </>
  );
}

function PlacementBox({
  placement,
  width,
  height,
  readonly,
  onChange,
  onRemove,
}: {
  placement: DraftPlacement;
  width: number;
  height: number;
  readonly: boolean;
  onChange: (patch: Partial<Placement>) => void;
  onRemove: () => void;
}) {
  const style: React.CSSProperties = {
    left: `${placement.xRatio * 100}%`,
    top: `${placement.yRatio * 100}%`,
    width: `${placement.widthRatio * 100}%`,
    height: `${placement.heightRatio * 100}%`,
  };

  const startDrag = (e: React.PointerEvent) => {
    if (readonly) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startXR = placement.xRatio;
    const startYR = placement.yRatio;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / width;
      const dy = (ev.clientY - startY) / height;
      onChange({
        xRatio: Math.max(0, Math.min(1 - placement.widthRatio, startXR + dx)),
        yRatio: Math.max(0, Math.min(1 - placement.heightRatio, startYR + dy)),
      });
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e: React.PointerEvent) => {
    if (readonly) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = placement.widthRatio;
    const startH = placement.heightRatio;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / width;
      const dy = (ev.clientY - startY) / height;
      onChange({
        widthRatio: Math.max(0.05, Math.min(1 - placement.xRatio, startW + dx)),
        heightRatio: Math.max(0.03, Math.min(1 - placement.yRatio, startH + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="signature-placement" style={style} onPointerDown={startDrag}>
      {placement.type === 'draw' && placement.dataUrl && (
        <img src={placement.dataUrl} alt="" />
      )}
      {placement.type === 'type' && placement.text && (
        <span
          className="px-2 text-slate-900"
          style={{
            fontFamily: placement.fontFamily || 'Helvetica',
            fontSize: `${placement.heightRatio * height * 0.6}px`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {placement.text}
        </span>
      )}
      {!readonly && (
        <>
          <button
            type="button"
            className="remove"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove"
          >
            ×
          </button>
          <div className="handle" onPointerDown={startResize} />
        </>
      )}
    </div>
  );
}
