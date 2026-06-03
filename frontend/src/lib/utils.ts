import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDate(iso?: string | Date | null) {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function statusColor(status: string) {
  switch (status) {
    case 'signed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'draft':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'uploaded':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
