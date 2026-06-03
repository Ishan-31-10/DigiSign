import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import env from '../config/env.js';

async function ensureUploadDirs() {
  await fs.mkdir(path.join(env.uploadDir, 'originals'), { recursive: true });
  await fs.mkdir(path.join(env.uploadDir, 'signed'), { recursive: true });
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function readPdfMeta(buffer) {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return { pageCount: pdf.getPageCount() };
}

/**
 * Persists the uploaded PDF buffer to disk under originals/.
 * Returns { storageKey, sha, pageCount, sizeBytes }.
 */
async function persistOriginal(buffer, originalName) {
  await ensureUploadDirs();
  const sha = sha256(buffer);
  const filename = `${Date.now()}-${sha.slice(0, 12)}.pdf`;
  const storageKey = path.join('originals', filename);
  const fullPath = path.join(env.uploadDir, storageKey);
  await fs.writeFile(fullPath, buffer);
  const { pageCount } = await readPdfMeta(buffer);
  return {
    storageKey,
    sha,
    pageCount,
    sizeBytes: buffer.length,
    originalName,
  };
}

function dataUrlToBytes(dataUrl) {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl || '');
  if (!match) return null;
  return { mime: match[1].toLowerCase(), bytes: Buffer.from(match[2], 'base64') };
}

/**
 * Renders placements onto the original PDF and writes a signed copy.
 * Also stamps a verification footer with the verification ID.
 *
 * placements: [{ page, xRatio, yRatio, widthRatio, heightRatio, type, dataUrl?, text?, fontFamily? }]
 *
 * Coordinates use top-left origin (matches the frontend overlay); we
 * convert to PDF coords (bottom-left origin) here.
 */
async function generateSignedPdf({
  originalBuffer,
  placements,
  verificationId,
  signedByName,
  signedByEmail,
  verifyUrl,
}) {
  const pdf = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  for (const p of placements) {
    if (p.page < 1 || p.page > pages.length) continue;
    const page = pages[p.page - 1];
    const { width: pw, height: ph } = page.getSize();
    const w = p.widthRatio * pw;
    const h = p.heightRatio * ph;
    const x = p.xRatio * pw;
    // top-left -> bottom-left
    const y = ph - p.yRatio * ph - h;

    if (p.type === 'draw' && p.dataUrl) {
      const parsed = dataUrlToBytes(p.dataUrl);
      if (parsed) {
        const img =
          parsed.mime === 'png'
            ? await pdf.embedPng(parsed.bytes)
            : await pdf.embedJpg(parsed.bytes);
        page.drawImage(img, { x, y, width: w, height: h });
      }
    } else if (p.type === 'type' && p.text) {
      // Fit text into the box by computing a max font size
      let size = h * 0.75;
      const text = p.text;
      while (size > 6 && helv.widthOfTextAtSize(text, size) > w) {
        size -= 1;
      }
      page.drawText(text, {
        x,
        y: y + (h - size) / 2,
        size,
        font: helv,
        color: rgb(0.05, 0.1, 0.4),
      });
    }
  }

  // Verification footer on the last page
  if (verificationId) {
    const last = pages[pages.length - 1];
    const { width: pw } = last.getSize();
    const footerY = 18;
    last.drawText('Signed via DigSign', {
      x: 24,
      y: footerY + 12,
      size: 8,
      font: helvBold,
      color: rgb(0.25, 0.25, 0.3),
    });
    last.drawText(`Verification ID: ${verificationId}`, {
      x: 24,
      y: footerY,
      size: 7,
      font: helv,
      color: rgb(0.3, 0.3, 0.35),
    });
    if (verifyUrl) {
      const line = `Verify at: ${verifyUrl}`;
      const w = helv.widthOfTextAtSize(line, 7);
      last.drawText(line, {
        x: pw - w - 24,
        y: footerY,
        size: 7,
        font: helv,
        color: rgb(0.3, 0.3, 0.35),
      });
    }
    if (signedByName) {
      last.drawText(`Signed by: ${signedByName}${signedByEmail ? ` <${signedByEmail}>` : ''}`, {
        x: pw - helv.widthOfTextAtSize(`Signed by: ${signedByName}`, 7) - 24,
        y: footerY + 12,
        size: 7,
        font: helv,
        color: rgb(0.3, 0.3, 0.35),
      });
    }
  }

  const out = Buffer.from(await pdf.save());
  const sha = sha256(out);
  const filename = `${Date.now()}-${verificationId}.pdf`;
  const storageKey = path.join('signed', filename);
  await ensureUploadDirs();
  await fs.writeFile(path.join(env.uploadDir, storageKey), out);
  return { storageKey, sha, sizeBytes: out.length };
}

async function readStoredFile(storageKey) {
  return fs.readFile(path.join(env.uploadDir, storageKey));
}

async function deleteStoredFile(storageKey) {
  if (!storageKey) return;
  try {
    await fs.unlink(path.join(env.uploadDir, storageKey));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

export {
  ensureUploadDirs,
  persistOriginal,
  generateSignedPdf,
  readStoredFile,
  deleteStoredFile,
  sha256,
};
