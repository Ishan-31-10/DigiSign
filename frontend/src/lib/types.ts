export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
};

export type DocumentStatus = 'uploaded' | 'draft' | 'signed';

export type Placement = {
  _id?: string;
  signatureId?: string | null;
  page: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  type: 'draw' | 'type';
  dataUrl?: string | null;
  text?: string | null;
  fontFamily?: string | null;
};

export type DocumentDoc = {
  _id: string;
  owner: string | User;
  originalName: string;
  storageKey: string;
  signedStorageKey?: string;
  sizeBytes: number;
  pageCount: number;
  status: DocumentStatus;
  placements: Placement[];
  documentHash?: string;
  verificationId?: string;
  signedAt?: string;
  signedByName?: string;
  signedByEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type Signature = {
  _id: string;
  label: string;
  type: 'draw' | 'type';
  dataUrl?: string;
  text?: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: string;
};

export type AuditLog = {
  _id: string;
  actor?: { _id: string; name: string; email: string } | null;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  status: 'success' | 'failure';
  createdAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: { path: string; message: string }[];
};
