import type { ApiResponse } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://digisign-pbcb.onrender.com/api';

const TOKEN_KEY = 'digsign_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];
  constructor(
    message: string,
    status: number,
    details?: { path: string; message: string }[]
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | undefined | null>;
  raw?: boolean; // return raw Response (for file downloads)
  signal?: AbortSignal;
  auth?: boolean; // attach Authorization header. default: true unless formData/raw says otherwise
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(
    `${API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const useAuth = opts.auth !== false;
  if (useAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method || (body ? 'POST' : 'GET'),
    headers,
    body,
    signal: opts.signal,
    cache: 'no-store',
  });

  if (opts.raw) return res as unknown as T;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (payload && (payload as ApiResponse<unknown>).message) ||
      `Request failed with ${res.status}`;
    throw new ApiError(message, res.status, (payload as ApiResponse<unknown>)?.details);
  }

  return (payload as ApiResponse<T>)?.data as T;
}

export async function downloadFile(path: string, filename: string) {
  const res = (await api(path, { raw: true })) as Response;
  if (!res.ok) throw new ApiError('Download failed', res.status);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export { API_URL };
