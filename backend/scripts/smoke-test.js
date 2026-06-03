/* eslint-disable no-console */
/**
 * End-to-end smoke test that exercises the API against an in-memory MongoDB.
 * Not shipped as part of the production image — it's a developer aid you
 * can run from the backend folder with:
 *
 *   node scripts/smoke-test.js
 *
 * If anything fails, the script exits with a non-zero code.
 */

import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set required env vars BEFORE loading any project code.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'smoke-test-secret-that-is-long-enough';
process.env.PORT = '0';
process.env.UPLOAD_DIR = path.join(__dirname, '..', '.smoke-storage');
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';

if (fs.existsSync(process.env.UPLOAD_DIR)) {
  fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
}

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import { PDFDocument } from 'pdf-lib';

let mongo;

async function start() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);

  const pdfService = await import('../src/services/pdf.service.js');
  await pdfService.ensureUploadDirs();

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/auth', (await import('../src/routes/auth.routes.js')).default);
  app.use('/api/documents', (await import('../src/routes/document.routes.js')).default);
  app.use('/api/signatures', (await import('../src/routes/signature.routes.js')).default);
  app.use('/api/verify', (await import('../src/routes/verification.routes.js')).default);
  app.use('/api/admin', (await import('../src/routes/admin.routes.js')).default);
  app.use((await import('../src/middleware/errorHandler.js')).errorHandler);

  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function makeRequest(server, options, body) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        ...options,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(buffer.toString()) });
            } catch (e) {
              resolve({ status: res.statusCode, body: buffer.toString() });
            }
          } else {
            resolve({ status: res.statusCode, buffer, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const json = (server, method, path, body, token) =>
  makeRequest(
    server,
    {
      method,
      path,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    },
    body ? JSON.stringify(body) : undefined
  );

function multipart(server, path, fileBuffer, filename, token) {
  const boundary = '----smoketest' + Math.random().toString(16).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, fileBuffer, tail]);
  return makeRequest(
    server,
    {
      method: 'POST',
      path,
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'content-length': body.length,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    },
    body
  );
}

function expect(label, cond) {
  if (!cond) {
    console.error('  ✗ ' + label);
    process.exitCode = 1;
    throw new Error('Assertion failed: ' + label);
  }
  console.log('  ✓ ' + label);
}

async function makeSamplePdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 600]);
  page.drawText('DigSign smoke test PDF', { x: 50, y: 550, size: 16 });
  return Buffer.from(await pdf.save());
}

async function run() {
  const server = await start();
  console.log('\n▶ Smoke test (in-memory MongoDB) running...\n');

  // 1. Register
  let res = await json(server, 'POST', '/api/auth/register', {
    name: 'Smoke Tester',
    email: 'smoke@digsign.local',
    password: 'Smoke123Pass',
  });
  expect('register returns 201', res.status === 201);
  expect('register returns a token', !!res.body.data?.token);
  const token = res.body.data.token;

  // 2. Login (also verifies bcrypt round-trip)
  res = await json(server, 'POST', '/api/auth/login', {
    email: 'smoke@digsign.local',
    password: 'Smoke123Pass',
  });
  expect('login succeeds', res.status === 200 && res.body.data.token);

  // 3. me
  res = await json(server, 'GET', '/api/auth/me', null, token);
  expect('me returns the current user', res.status === 200 && res.body.data.user.email === 'smoke@digsign.local');

  // 4. Upload a PDF
  const pdfBuf = await makeSamplePdf();
  res = await multipart(server, '/api/documents', pdfBuf, 'sample.pdf', token);
  expect('upload returns 201', res.status === 201);
  expect('upload returns a document', !!res.body.data?.document?._id);
  const docId = res.body.data.document._id;
  expect('document has correct page count', res.body.data.document.pageCount === 1);
  expect('document status is "uploaded"', res.body.data.document.status === 'uploaded');

  // 5. List documents
  res = await json(server, 'GET', '/api/documents', null, token);
  expect('list returns the uploaded document', res.body.data.documents.length === 1);

  // 6. Save draft placements
  const placements = [
    {
      page: 1,
      xRatio: 0.6,
      yRatio: 0.8,
      widthRatio: 0.3,
      heightRatio: 0.08,
      type: 'type',
      text: 'Smoke Tester',
      fontFamily: 'Helvetica',
    },
  ];
  res = await json(server, 'PUT', `/api/documents/${docId}/placements`, { placements }, token);
  expect('save draft returns 200', res.status === 200);
  expect('document is now in draft status', res.body.data.document.status === 'draft');

  // 7. Finalize
  res = await json(server, 'POST', `/api/documents/${docId}/finalize`, { placements }, token);
  expect('finalize returns 200', res.status === 200);
  const verificationId = res.body.data.verificationId;
  const documentHash = res.body.data.document.documentHash;
  expect('finalize returns a verification ID', !!verificationId);
  expect('finalize returns a document hash (sha256)', /^[a-f0-9]{64}$/.test(documentHash));
  expect('document status is now "signed"', res.body.data.document.status === 'signed');

  // 8. Download signed PDF
  res = await makeRequest(server, {
    method: 'GET',
    path: `/api/documents/${docId}/file?variant=signed`,
    headers: { authorization: `Bearer ${token}` },
  });
  expect('signed download returns 200', res.status === 200);
  expect('signed download returns a PDF', res.buffer.slice(0, 4).toString() === '%PDF');

  // 9. Public verification by ID
  res = await json(server, 'GET', `/api/verify/${verificationId}`);
  expect('verify by ID is valid', res.body.data.valid === true);
  expect('verify by ID returns matching hash', res.body.data.documentHash === documentHash);

  // 10. Public verification by hash
  res = await json(server, 'GET', `/api/verify/hash/${documentHash}`);
  expect('verify by hash is valid', res.body.data.valid === true);

  // 11. Public verification by file (re-upload the signed PDF)
  const signedDownload = await makeRequest(server, {
    method: 'GET',
    path: `/api/documents/${docId}/file?variant=signed`,
    headers: { authorization: `Bearer ${token}` },
  });
  res = await multipart(server, '/api/verify', signedDownload.buffer, 'signed.pdf');
  expect('verify by file is valid', res.body.data.valid === true);
  expect('verify by file recomputes the same hash', res.body.data.computedHash === documentHash);

  // 12. Verify by file with a *modified* PDF (should fail)
  const tampered = Buffer.concat([signedDownload.buffer, Buffer.from('x')]);
  res = await multipart(server, '/api/verify', tampered, 'tampered.pdf');
  expect('verify of tampered PDF reports invalid', res.body.data.valid === false);

  // 13. Audit log was populated (via admin endpoint)
  const { default: User } = await import('../src/models/User.js');
  await User.updateOne({ email: 'smoke@digsign.local' }, { role: 'admin' });
  res = await json(server, 'POST', '/api/auth/login', {
    email: 'smoke@digsign.local',
    password: 'Smoke123Pass',
  });
  const adminToken = res.body.data.token;
  res = await json(server, 'GET', '/api/admin/audits', null, adminToken);
  expect('audit log is populated', res.body.data.items.length >= 5);
  const actions = new Set(res.body.data.items.map((i) => i.action));
  expect('audit log contains document.upload', actions.has('document.upload'));
  expect('audit log contains document.sign', actions.has('document.sign'));
  expect('audit log contains document.verify', actions.has('document.verify'));
  expect('audit log contains user.login', actions.has('user.login'));

  // 14. Reset password flow
  res = await json(server, 'POST', '/api/auth/forgot-password', {
    email: 'smoke@digsign.local',
  });
  expect('forgot-password returns 200', res.status === 200);
  expect('forgot-password returns a dev reset URL', !!res.body.data?.resetUrl);
  const url = new URL(res.body.data.resetUrl);
  const resetToken = url.searchParams.get('token');
  res = await json(server, 'POST', '/api/auth/reset-password', {
    email: 'smoke@digsign.local',
    token: resetToken,
    password: 'NewPass1234',
  });
  expect('reset-password returns 200', res.status === 200);
  res = await json(server, 'POST', '/api/auth/login', {
    email: 'smoke@digsign.local',
    password: 'NewPass1234',
  });
  expect('login with new password succeeds', res.status === 200);

  // 15. Failed login is rejected and audited
  res = await json(server, 'POST', '/api/auth/login', {
    email: 'smoke@digsign.local',
    password: 'wrong-password',
  });
  expect('bad login is rejected', res.status === 401);

  // 16. Stats
  res = await json(server, 'GET', '/api/admin/stats', null, adminToken);
  expect('stats returns correct counts', res.body.data.counts.users === 1 && res.body.data.counts.signed === 1);

  console.log('\n✅ Smoke test passed.\n');
  server.close();
}

run()
  .catch((err) => {
    console.error('\n✗ Smoke test failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (fs.existsSync(process.env.UPLOAD_DIR)) {
      fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
    }
  });
