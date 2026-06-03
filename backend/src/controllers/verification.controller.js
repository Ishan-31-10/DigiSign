import crypto from 'crypto';
import Document from '../models/Document.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/response.js';
import * as audit from '../services/audit.service.js';
import * as pdfService from '../services/pdf.service.js';

/**
 * Public verification.
 *  - by ID:    GET /verify/:id
 *  - by hash:  GET /verify/hash/:hash
 *  - by file:  POST /verify  (multipart: file)  -> compares uploaded PDF hash
 */
function summary(doc) {
  return {
    valid: true,
    verificationId: doc.verificationId,
    documentHash: doc.documentHash,
    originalName: doc.originalName,
    pageCount: doc.pageCount,
    signedAt: doc.signedAt,
    signedByName: doc.signedByName,
    signedByEmail: maskEmail(doc.signedByEmail),
    placements: doc.placements?.length || 0,
  };
}

function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export const byId = async (req, res) => {
  const doc = await Document.findOne({
    verificationId: req.params.id.toUpperCase(),
    status: 'signed',
  });
  await audit.log(req, {
    action: 'document.verify',
    metadata: { method: 'id', id: req.params.id, found: !!doc },
  });
  if (!doc) return ok(res, { valid: false }, 'No signed document matches that ID');
  return ok(res, summary(doc));
};

export const byHash = async (req, res) => {
  const doc = await Document.findOne({
    documentHash: req.params.hash.toLowerCase(),
    status: 'signed',
  });
  await audit.log(req, {
    action: 'document.verify',
    metadata: { method: 'hash', hash: req.params.hash, found: !!doc },
  });
  if (!doc) return ok(res, { valid: false }, 'No signed document matches that hash');
  return ok(res, summary(doc));
};

export const byFile = async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Upload a PDF to verify');
  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const doc = await Document.findOne({ documentHash: hash, status: 'signed' });
  await audit.log(req, {
    action: 'document.verify',
    metadata: { method: 'file', hash, found: !!doc },
  });
  if (!doc) {
    return ok(
      res,
      { valid: false, computedHash: hash },
      'This file was not signed via DigSign (or it was modified after signing).'
    );
  }
  return ok(res, { ...summary(doc), computedHash: hash });
};
