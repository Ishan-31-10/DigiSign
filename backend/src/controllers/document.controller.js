import crypto from "crypto";
import path from "path";
import Document from "../models/Document.js";
import Signature from "../models/Signature.js";
import ApiError from "../utils/ApiError.js";
import { ok, created } from "../utils/response.js";
import * as audit from "../services/audit.service.js";
import env from "../config/env.js";
import * as pdfService from "../services/pdf.service.js";

export const upload = async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const { storageKey, sha, pageCount, sizeBytes, originalName } =
    await pdfService.persistOriginal(req.file.buffer, req.file.originalname);

  const doc = await Document.create({
    owner: req.user._id,
    originalName,
    storageKey,
    sizeBytes,
    pageCount,
    status: "uploaded",
  });

  await audit.log(req, {
    action: "document.upload",
    targetType: "Document",
    targetId: doc._id,
    metadata: { originalName, sha, pageCount },
  });

  return created(res, { document: doc });
};

export const list = async (req, res) => {
  const { status, q } = req.query;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (q) filter.originalName = { $regex: q, $options: "i" };

  const docs = await Document.find(filter).sort({ createdAt: -1 }).limit(200);
  return ok(res, { documents: docs });
};

async function findOwnedDoc(req) {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  const isOwner = doc.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) throw ApiError.forbidden();
  return doc;
}

export const get = async (req, res) => {
  const doc = await findOwnedDoc(req);
  return ok(res, { document: doc });
};

export const remove = async (req, res) => {
  const doc = await findOwnedDoc(req);
  await pdfService.deleteStoredFile(doc.storageKey);
  await pdfService.deleteStoredFile(doc.signedStorageKey);
  await doc.deleteOne();
  await audit.log(req, {
    action: "document.delete",
    targetType: "Document",
    targetId: doc._id,
    metadata: { originalName: doc.originalName },
  });
  return ok(res, null, "Document deleted");
};

/**
 * Stream either the original or the signed PDF.
 *   /documents/:id/file?variant=original|signed
 */
export const download = async (req, res) => {
  const doc = await findOwnedDoc(req);
  const variant = req.query.variant === "signed" ? "signed" : "original";
  const key = variant === "signed" ? doc.signedStorageKey : doc.storageKey;
  if (!key) throw ApiError.notFound(`No ${variant} file available`);

  const buffer = await pdfService.readStoredFile(key);
  const filename =
    variant === "signed" ? `signed-${doc.originalName}` : doc.originalName;

  await audit.log(req, {
    action: "document.download",
    targetType: "Document",
    targetId: doc._id,
    metadata: { variant },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${req.query.disposition === "attachment" ? "attachment" : "inline"}; filename="${filename.replace(/"/g, "")}"`,
  );
  res.send(buffer);
};

/**
 * Save placements as a "draft" — does NOT generate a signed PDF.
 * Used to let the user resume signing later.
 */
export const savePlacements = async (req, res) => {
  const doc = await findOwnedDoc(req);
  if (doc.status === "signed")
    throw ApiError.badRequest("Document is already finalized");

  doc.placements = req.body.placements || [];
  doc.status = doc.placements.length ? "draft" : "uploaded";
  await doc.save();

  return ok(res, { document: doc }, "Draft saved");
};

/**
 * Finalize: render placements onto the PDF, compute SHA-256 of the
 * signed file, create a verification ID, and persist signed/.
 */
export const finalize = async (req, res) => {
  const doc = await findOwnedDoc(req);
  if (doc.status === "signed")
    throw ApiError.badRequest("Document is already finalized");

  const placements = req.body.placements || doc.placements || [];
  if (!placements.length)
    throw ApiError.badRequest("Add at least one signature before finalizing");

  const originalBuffer = await pdfService.readStoredFile(doc.storageKey);
  const verificationId = crypto.randomBytes(8).toString("hex").toUpperCase();
  const verifyUrl = `${env.frontendUrl}/verify?id=${verificationId}`;

  const { storageKey: signedKey, sha: signedSha } =
    await pdfService.generateSignedPdf({
      originalBuffer,
      placements,
      verificationId,
      signedByName: req.user.name,
      signedByEmail: req.user.email,
      verifyUrl,
    });

  doc.placements = placements;
  doc.signedStorageKey = signedKey;
  doc.documentHash = signedSha;
  doc.verificationId = verificationId;
  doc.status = "signed";
  doc.signedAt = new Date();
  doc.signedByName = req.user.name;
  doc.signedByEmail = req.user.email;
  await doc.save();

  await audit.log(req, {
    action: "document.sign",
    targetType: "Document",
    targetId: doc._id,
    metadata: { verificationId, sha: signedSha, placements: placements.length },
  });

  return ok(
    res,
    { document: doc, verificationId, verifyUrl },
    "Document signed",
  );
};
