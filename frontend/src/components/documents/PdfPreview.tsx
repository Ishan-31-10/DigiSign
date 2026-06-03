'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// Use the worker from the matching pdfjs-dist version that react-pdf depends on.
// CDN keeps the bundle small and lets us avoid wiring up Webpack to ship the worker.
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

type Props = {
  fileUrl: string;
  authToken?: string | null;
  onLoad?: (pageCount: number) => void;
  renderOverlay?: (pageNumber: number, width: number, height: number) => React.ReactNode;
  /** Called when a page is clicked at a normalized (xRatio, yRatio) coordinate. */
  onPageClick?: (pageNumber: number, xRatio: number, yRatio: number) => void;
  className?: string;
};

export function PdfPreview({
  fileUrl,
  authToken,
  onLoad,
  renderOverlay,
  onPageClick,
  className,
}: Props) {
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Cache the file as a Blob URL so react-pdf isn't re-fetching with each render.
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFileSrc(null);
    (async () => {
      try {
        const res = await fetch(fileUrl, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setFileSrc(url);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [fileUrl, authToken]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load the document: {error}
      </div>
    );
  }
  if (!fileSrc) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Document
        file={fileSrc}
        onLoadSuccess={(p) => {
          setPages(p.numPages);
          onLoad?.(p.numPages);
        }}
        loading={
          <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
        }
        error={
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not render this PDF.
          </div>
        }
      >
        <div className="space-y-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((pageNumber) => (
            <PageBox
              key={pageNumber}
              pageNumber={pageNumber}
              renderOverlay={renderOverlay}
              onPageClick={onPageClick}
            />
          ))}
        </div>
      </Document>
    </div>
  );
}

function PageBox({
  pageNumber,
  renderOverlay,
  onPageClick,
}: {
  pageNumber: number;
  renderOverlay?: Props['renderOverlay'];
  onPageClick?: Props['onPageClick'];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative rounded-lg bg-white overflow-hidden">
      <div className="absolute right-2 top-2 z-20 rounded bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">
        Page {pageNumber}
      </div>
      <div
        ref={containerRef}
        className="relative"
        onClick={(e) => {
          if (!onPageClick) return;
          const target = e.currentTarget.getBoundingClientRect();
          const xRatio = (e.clientX - target.left) / target.width;
          const yRatio = (e.clientY - target.top) / target.height;
          onPageClick(pageNumber, xRatio, yRatio);
        }}
      >
        <Page pageNumber={pageNumber} width={size.width || 600} renderTextLayer={false} renderAnnotationLayer={false} />
        {renderOverlay && size.width > 0 && (
          <div className="signature-overlay" style={{ pointerEvents: 'none' }}>
            {renderOverlay(pageNumber, size.width, size.height)}
          </div>
        )}
      </div>
    </div>
  );
}
