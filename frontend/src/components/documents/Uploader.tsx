'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import type { DocumentDoc } from '@/lib/types';
import { cn, formatBytes } from '@/lib/utils';

type Props = {
  onUploaded?: (doc: DocumentDoc) => void;
  redirectOnUpload?: boolean;
  className?: string;
};

const MAX_MB = 25;

export function Uploader({ onUploaded, redirectOnUpload = true, className }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Max file size is ${MAX_MB}MB`);
      return;
    }
    try {
      setUploading(true);
      setProgress(`Uploading ${file.name} (${formatBytes(file.size)})`);
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ document: DocumentDoc }>('/documents', {
        method: 'POST',
        formData: fd,
      });
      toast.success('Document uploaded');
      onUploaded?.(res.document);
      if (redirectOnUpload) router.push(`/dashboard/documents/${res.document._id}/sign`);
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 border-dashed bg-white p-8 text-center transition-colors',
        dragOver ? 'border-brand-500 bg-brand-50/40' : 'border-slate-300',
        uploading && 'opacity-80',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {uploading ? 'Uploading…' : 'Upload a PDF to sign'}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {progress ?? `Drag and drop a PDF here, or click to select. Max ${MAX_MB} MB.`}
      </p>
      <div className="mt-5">
        <Button
          type="button"
          variant="outline"
          leftIcon={<FileText className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Choose a file
        </Button>
      </div>
    </div>
  );
}
