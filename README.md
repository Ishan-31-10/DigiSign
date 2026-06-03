# DigSign — Digital Signature & Document Management Platform

A production-oriented MVP that lets users upload PDF documents, sign them
electronically (draw / type), manage them through a dashboard, and lets any
third party verify authenticity through a public verification mechanism.

Built as a full-stack assessment with **Next.js 14 (App Router)**,
**Node.js / Express**, and **MongoDB**.

---

## Table of contents

1. [Project overview](#project-overview)
2. [Features implemented](#features-implemented)
3. [Technology stack](#technology-stack)
4. [Repository layout](#repository-layout)
5. [Quick start (Docker)](#quick-start-docker)
6. [Quick start (manual)](#quick-start-manual)
7. [Environment variables](#environment-variables)
8. [Demo credentials](#demo-credentials)
9. [Architecture overview](#architecture-overview)
10. [Database design](#database-design)
11. [API overview](#api-overview)
12. [Security model](#security-model)
13. [Verification mechanism](#verification-mechanism)
14. [Audit log](#audit-log)
15. [Deployment](#deployment)
16. [Assumptions made](#assumptions-made)
17. [Known limitations](#known-limitations)
18. [Future improvements](#future-improvements)

---

## Project overview

DigSign is a self-contained platform with three user-facing surfaces:

- **Public**: landing page, registration, login, password recovery and a
  public document verification page.
- **User dashboard**: upload PDFs, place signatures (drawn or typed),
  manage documents (status: `uploaded` / `draft` / `signed`), reuse
  saved signatures, download originals & signed copies.
- **Admin console**: platform stats, user management
  (role/status), document overview, paginated audit log.

Every signed PDF is hashed (SHA-256), stamped with a verification
footer, and registered against a short **verification ID** so any third
party can validate authenticity without an account.

---

## Features implemented

### Public

- [x] Landing page
- [x] User registration (strong-password enforcement)
- [x] User login (JWT-based)
- [x] Password recovery (`forgot` + `reset` with hashed, expiring tokens)
- [x] Public document verification (by ID, by hash, by file upload)

### Document workflow

- [x] PDF upload with mimetype + extension + size validation (max 25 MB)
- [x] In-browser PDF preview (`react-pdf` + `pdfjs-dist`)
- [x] Drag-to-place signatures, resize handles, per-page placement
- [x] Draw signatures (canvas) **or** type signatures (font picker)
- [x] Save drafts and resume incomplete signing flows
- [x] Finalize: render signatures into PDF, hash, assign verification ID
- [x] Download original and/or signed copy
- [x] Delete document (cleans up storage on disk)

### Reusable signatures

- [x] Save drawn/typed signatures to a personal library
- [x] Pick any saved signature from the signing screen

### User dashboard

- [x] Stats (totals by status), recent documents
- [x] Documents table with search + status filters
- [x] Per-document detail view + signing UI
- [x] Account settings + change password

### Verification

- [x] Public lookup by verification ID
- [x] Public lookup by SHA-256 hash
- [x] Public lookup by re-uploading the PDF (hash is recomputed server-side)

### Auditability

- [x] Append-only audit log model (`AuditLog`)
- [x] Coverage: register, login, login_failed, password reset request &
      complete, password change, document upload/delete/download/sign,
      document verification, signature create/delete, admin user updates
- [x] Captures actor, IP, user agent, and free-form metadata
- [x] Paginated admin viewer with action filters

### Administration

- [x] Admin role + middleware
- [x] Dashboard with stats and recent activity
- [x] User list (search), role promotion/demotion, account enable/disable
- [x] All-documents view with verification links
- [x] Audit log explorer

### Engineering

- [x] Zod validation on every mutating endpoint
- [x] Central error handler converting Mongoose / JWT / Multer errors
- [x] Helmet, CORS allow-list, `express-mongo-sanitize`, rate limiting on
      sensitive auth endpoints, password hashing with bcrypt
- [x] Dockerfiles for both apps + `docker-compose.yml` (Mongo included)
- [x] Seed script that creates demo admin & user accounts

---

## Technology stack

| Layer        | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Frontend     | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS  |
| PDF preview  | `react-pdf` (pdfjs-dist)                                     |
| Signing UI   | `react-signature-canvas`, custom drag/resize overlay         |
| Forms        | `react-hook-form` + `zod`                                    |
| Notifications | `react-hot-toast`                                           |
| Backend      | Node.js 20, Express 4                                        |
| Database     | MongoDB 7 (Mongoose 8)                                       |
| Auth         | JWT (jsonwebtoken) + bcryptjs                                |
| Validation   | `zod`                                                        |
| PDF backend  | `pdf-lib` (embed signatures, draw text/images, stamp footer) |
| Security     | helmet, express-mongo-sanitize, express-rate-limit, CORS     |
| File uploads | `multer` (memory storage; persisted under `storage/`)        |
| DevOps       | Docker, docker-compose                                       |

---

## Repository layout

```
DigSign/
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── config/           # env + db connection
│   │   ├── controllers/      # request handlers (auth, document, ...)
│   │   ├── middleware/       # auth, upload, errorHandler
│   │   ├── models/           # User, Document, Signature, AuditLog
│   │   ├── routes/           # express routers
│   │   ├── services/         # pdf.service, audit.service
│   │   ├── scripts/seed.js   # demo user seeder
│   │   ├── utils/            # ApiError, validate, asyncHandler, ms
│   │   └── server.js         # entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/              # routes (landing, auth, dashboard/, admin/, verify/)
│   │   ├── components/       # UI primitives + features (uploader, pad, viewer)
│   │   └── lib/              # api client, auth-context, useSWR, utils, types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Quick start (Docker)

The fastest way to run everything (Mongo + backend + frontend):

```bash
docker compose up --build
```

That builds two images and starts three containers:

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:3000     |
| Backend  | http://localhost:5000/api |
| MongoDB  | mongodb://localhost:27017 |

Seed demo accounts (once Mongo is up):

```bash
docker compose exec backend npm run seed
```

---

## Quick start (manual)

### Prerequisites

- Node.js **>= 18.17** (Node 20 recommended)
- npm 10+
- A running **MongoDB 6+** instance

### 1. Backend

```bash
cd backend
cp .env.example .env       # adjust as needed
npm install
npm run seed               # creates demo admin & user accounts
npm run dev                # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                # starts on http://localhost:3000
```

Open <http://localhost:3000> and sign in with one of the demo accounts.

### 3. (Optional) Run the end-to-end smoke test

A self-contained integration test exercises every important API path
against an in-memory MongoDB (no external dependencies needed):

```bash
cd backend
npm run smoke   # spins up an in-memory Mongo, hits the routes, asserts results
```

It covers: register → login → upload PDF → save draft → finalize → SHA-256
hash → public verification by ID/hash/file → tamper detection → password
reset → audit log → admin stats. 34 assertions.

---

## Environment variables

### Backend (`backend/.env`)

| Variable                  | Default                                | Purpose                                         |
| ------------------------- | -------------------------------------- | ----------------------------------------------- |
| `NODE_ENV`                | `development`                          | Runtime mode                                    |
| `PORT`                    | `5000`                                 | HTTP port                                       |
| `MONGODB_URI`             | `mongodb://127.0.0.1:27017/digsign`    | Mongo connection string                         |
| `JWT_SECRET`              | (required)                             | HMAC secret for signing JWTs                    |
| `JWT_EXPIRES_IN`          | `7d`                                   | JWT lifetime                                    |
| `RESET_TOKEN_EXPIRES_IN`  | `1h`                                   | Password reset token TTL                        |
| `CORS_ORIGIN`             | `http://localhost:3000`                | Comma-separated allow-list                      |
| `FRONTEND_URL`            | `http://localhost:3000`                | Base URL embedded in reset / verify links       |
| `UPLOAD_DIR`              | `./storage`                            | Where original + signed PDFs are persisted      |
| `MAX_FILE_SIZE_MB`        | `25`                                   | Per-upload limit                                |
| `SEED_ADMIN_EMAIL/PASS`   | `admin@digsign.local / Admin@12345`    | Used by `npm run seed`                          |
| `SEED_USER_EMAIL/PASS`    | `demo@digsign.local / Demo@12345`      | Used by `npm run seed`                          |

### Frontend (`frontend/.env.local`)

| Variable                | Default                          | Purpose                                |
| ----------------------- | -------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:5000/api`      | Base URL the browser hits for the API  |

Example files are provided at `backend/.env.example` and
`frontend/.env.example`.

---

## Demo credentials

After running the seed script:

| Role  | Email                  | Password     |
| ----- | ---------------------- | ------------ |
| User  | `demo@digsign.local`   | `Demo@12345` |
| Admin | `admin@digsign.local`  | `Admin@12345` |

> **Change these in any non-demo deployment.** The seed script honours
> the `SEED_*` environment variables if you want different credentials.

---

## Architecture overview

```
┌──────────────────┐        REST (JSON)         ┌─────────────────────┐
│  Next.js 14 SPA  │ ─────────────────────────► │ Express API (Node)  │
│ (App Router)     │ ◄───────────────────────── │ - routers/contolers │
│ Tailwind + RHF   │      Bearer JWT auth       │ - middleware (auth, │
│ react-pdf viewer │                            │   upload, error)    │
└──────────────────┘                            │ - services (pdf,    │
        ▲                                       │   audit)            │
        │                                       └──────────┬──────────┘
        │                                                  │ Mongoose
        │ static / dynamic                                 ▼
        │                                       ┌──────────────────────┐
        │                                       │  MongoDB             │
        │                                       │  users / documents / │
        │                                       │  signatures /        │
        │                                       │  audit_logs          │
        │                                       └──────────────────────┘
                                                  ▲
                                                  │ fs.writeFile
                                                  │
                                       ┌────────────────────┐
                                       │  storage/          │
                                       │   originals/  *.pdf │
                                       │   signed/     *.pdf │
                                       └────────────────────┘
```

Design highlights:

- **Stateless API**: scales horizontally; only assumption is shared
  storage for `UPLOAD_DIR` (or swap the `pdf.service` for S3).
- **Strict layer separation**: routes → controllers → services →
  models. No business logic in routes.
- **Append-only audit log** kept in Mongo so the same datastore can be
  queried by the admin UI.
- **Normalized placement coordinates** (0..1) so a PDF rendered at any
  resolution renders identically — no DPI assumptions.
- **JWT in `Authorization: Bearer`** (sent from the SPA via `fetch`).
  Tokens are also accepted via cookies, allowing easy migration to a
  cookie-based session model later.

---

## Database design

Four Mongo collections:

### `users`

| Field                  | Type      | Notes                                     |
| ---------------------- | --------- | ----------------------------------------- |
| `_id`                  | ObjectId  |                                           |
| `name`                 | String    | trimmed, max 100                          |
| `email`                | String    | lowercased, **unique index**              |
| `passwordHash`         | String    | bcrypt; `select: false`                   |
| `role`                 | Enum      | `user` \| `admin` (indexed)               |
| `status`               | Enum      | `active` \| `disabled`                    |
| `resetTokenHash`       | String    | SHA-256 of plain reset token              |
| `resetTokenExpiresAt`  | Date      |                                           |
| `lastLoginAt`          | Date      |                                           |
| `createdAt/updatedAt`  | Date      |                                           |

### `documents`

| Field                | Type          | Notes                                              |
| -------------------- | ------------- | -------------------------------------------------- |
| `_id`                | ObjectId      |                                                    |
| `owner`              | ObjectId(User)| **indexed**                                        |
| `originalName`       | String        |                                                    |
| `storageKey`         | String        | `originals/<ts>-<sha12>.pdf`                       |
| `signedStorageKey`   | String        | `signed/<ts>-<verificationId>.pdf` after finalize  |
| `sizeBytes`          | Number        |                                                    |
| `pageCount`          | Number        | read from PDF on upload                            |
| `status`             | Enum          | `uploaded` \| `draft` \| `signed` (indexed)        |
| `placements`         | Array         | `{page, xRatio, yRatio, widthRatio, heightRatio, type, dataUrl?, text?, fontFamily?}` — normalized coordinates |
| `documentHash`       | String        | SHA-256 of signed PDF (indexed)                    |
| `verificationId`     | String        | 16-char hex, **unique + sparse index**             |
| `signedAt`           | Date          |                                                    |
| `signedByName/Email` | String        | snapshot of the signer                             |

Compound index: `{ owner: 1, createdAt: -1 }` for fast dashboards.

### `signatures`

Personal library of reusable signatures (drawn PNG or typed text).
Indexed by `user`.

### `audit_logs`

| Field         | Type          | Notes                                            |
| ------------- | ------------- | ------------------------------------------------ |
| `actor`       | ObjectId(User)| optional (e.g. failed-login may have no actor)   |
| `actorEmail`  | String        | denormalized, survives user deletion             |
| `action`      | String        | dotted (`document.sign`, `user.login`, ...)      |
| `targetType/Id`| String/Id    | resource the action applied to                   |
| `ip`/`userAgent`| String      |                                                  |
| `metadata`    | Mixed         | small, action-specific payload                   |
| `status`      | Enum          | `success` \| `failure`                           |
| `createdAt`   | Date          | indexed (and combined with `action`)             |

### Reasoning

- **Embedded `placements`** inside `documents`: placements are tightly
  coupled to a single document, always loaded together, and small
  enough to embed. Avoids an extra query when rendering the signing
  screen.
- **Verification ID + hash on the document** itself (not in a separate
  collection): verifications are read-mostly lookups, and storing them
  as indexed fields makes both `byId` and `byHash` queries O(log n).
- **Audit log in Mongo** (not flat file / external sink): single source
  of truth for the admin UI, queryable, indexed by `action` and
  `createdAt` for the common filter + paginate use case.
- **Reusable signatures** as their own collection because their
  lifecycle is independent of documents — users can manage them
  separately and they may be referenced by many documents over time.

---

## API overview

Base URL: `/api`

### Health

| Method | Path           | Description       |
| ------ | -------------- | ----------------- |
| GET    | `/health`      | Service health    |

### Auth

| Method | Path                          | Auth | Description                              |
| ------ | ----------------------------- | ---- | ---------------------------------------- |
| POST   | `/auth/register`              | —    | Create account, returns JWT              |
| POST   | `/auth/login`                 | —    | Email/password login, returns JWT        |
| POST   | `/auth/forgot-password`       | —    | Generates reset token; URL returned in dev |
| POST   | `/auth/reset-password`        | —    | Consume token, set new password          |
| GET    | `/auth/me`                    | JWT  | Current user                             |
| POST   | `/auth/change-password`       | JWT  | Change own password                      |

### Documents

| Method | Path                              | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/documents`                      | List own documents (filters: `status`, `q`)    |
| POST   | `/documents`                      | Multipart upload (`file=...pdf`)               |
| GET    | `/documents/:id`                  | Get a single document                          |
| DELETE | `/documents/:id`                  | Delete + remove files                          |
| GET    | `/documents/:id/file?variant=...` | Stream PDF (`original` \| `signed`)            |
| PUT    | `/documents/:id/placements`       | Save draft placements                          |
| POST   | `/documents/:id/finalize`         | Render placements, hash, assign verification ID |

### Signatures

| Method | Path                | Description           |
| ------ | ------------------- | --------------------- |
| GET    | `/signatures`       | List own signatures   |
| POST   | `/signatures`       | Create a signature    |
| DELETE | `/signatures/:id`   | Delete a signature    |

### Verification (public)

| Method | Path                       | Description                                       |
| ------ | -------------------------- | ------------------------------------------------- |
| GET    | `/verify/:id`              | Look up by verification ID                        |
| GET    | `/verify/hash/:hash`       | Look up by SHA-256                                |
| POST   | `/verify`                  | Multipart upload — hash file, compare to records  |

### Admin (role = admin)

| Method | Path                | Description                            |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/admin/stats`      | Counts + recent users/documents        |
| GET    | `/admin/users`      | List users (search via `q`)            |
| PATCH  | `/admin/users/:id`  | Update `role` and/or `status`          |
| GET    | `/admin/documents`  | All documents with owners              |
| GET    | `/admin/audits`     | Paginated audit log (filter by action) |

Every response uses the same envelope:

```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors return `success: false` with optional `details` (Zod errors).

---

## Security model

- **Password hashing**: bcrypt (10 rounds), `select: false` on the hash
  to avoid accidental leakage.
- **JWT**: HMAC-SHA256, 7-day default lifetime, includes
  `{ sub, role, email }`. Disabled accounts cannot authenticate.
- **Rate limiting** on `/auth/login`, `/auth/register`,
  `/auth/forgot-password` (30 requests / 15 min / IP).
- **Helmet** security headers, `Referrer-Policy`, `X-Frame-Options`.
- **NoSQL injection protection** via `express-mongo-sanitize`.
- **CORS allow-list** driven by `CORS_ORIGIN`.
- **Strict file validation**: mimetype = `application/pdf`, `.pdf`
  extension, `MAX_FILE_SIZE_MB`, multer memory storage so failed
  uploads never touch disk.
- **Password reset tokens** are stored as SHA-256 hashes server-side;
  only the plain token is sent to the user, valid for `RESET_TOKEN_EXPIRES_IN`.
- **Tamper-evident signed PDFs**: every signed PDF gets a SHA-256
  hash stored in Mongo + a footer stamp with the verification ID.
- **Audit log** records both successes and failures (failed logins,
  for example), enabling later anomaly detection.
- Authenticated users can only see/modify their own documents (ownership
  check in every document handler); admins can view all documents.

---

## Verification mechanism

When a user finalizes signing:

1. The backend reads the original PDF, renders all placements onto the
   appropriate pages (with PDF coordinate-system conversion).
2. A verification footer is stamped on the last page:
   `"Signed via DigSign"`, the verification ID, signer info, and a
   public verify URL.
3. The signed PDF bytes are written to `storage/signed/` and **hashed
   with SHA-256**.
4. The hash and a fresh 16-char hex `verificationId` are stored on the
   `documents` document.

Third parties can verify a document in three ways:

- Visit `/verify?id=<verificationId>` and see the signature metadata.
- Hit `GET /api/verify/hash/<sha256>` directly.
- Upload the file at `/verify` — the server recomputes the hash and
  compares it. **If the file was modified post-signing, the hashes won't
  match and the response is `valid: false`.** This is what makes the
  scheme tamper-evident.

---

## Audit log

Every important action is recorded in the `audit_logs` collection
through the `audit.service`. Logging is fire-and-forget so it can
never break the originating request.

Tracked actions:

- `user.register`, `user.login`, `user.login_failed`
- `user.password_reset_requested`, `user.password_reset_completed`, `user.password_changed`
- `document.upload`, `document.delete`, `document.download`, `document.sign`
- `document.verify` (with method: `id`/`hash`/`file` + found yes/no)
- `signature.create`, `signature.delete`
- `admin.user_update` (role / status changes)

Admin → **Audit log** displays them with paging + filter by action.

---

## Deployment

Recommended production layout:

- **Frontend**: Vercel
- **Backend**: Render using `render.yaml`
- **Database**: MongoDB Atlas

Docker Compose is kept for local testing. Do not deploy the Compose
MongoDB container as the production database.

### 1. MongoDB Atlas

Create an Atlas cluster and copy the driver connection string:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/digsign?retryWrites=true&w=majority
```

If the password contains special characters, URL-encode it. In Atlas
Network Access, allow your backend host. For initial testing you can use
`0.0.0.0/0`, then restrict it later.

### 2. Backend on Render

This repo includes `render.yaml`.

1. Push the repo to GitHub.
2. In Render, create a **Blueprint** from the repo.
3. Set these env vars:

```env
MONGODB_URI=<your Atlas connection string>
CORS_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

`JWT_SECRET` is generated by Render from `render.yaml`; you may replace
it with your own long random secret.

Backend health check:

```text
https://your-render-backend.onrender.com/api/health
```

Seed accounts from Render Shell:

```bash
npm run seed
```

### 3. Frontend on Vercel

1. Import the same GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com/api
```

After Vercel creates the final frontend URL, update Render:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Then redeploy the backend.

See `DEPLOYMENT.md` for the short checklist.

---

## Assumptions made

- The platform issues **electronic signatures**, not cryptographic
  PKI-based digital signatures (no PAdES). The integrity check is via
  the **SHA-256 of the signed file** registered server-side.
- File storage is **local disk** for the MVP. Swappable behind
  `pdf.service`; production should use S3-compatible object storage.
- An **email provider** is out of scope for a 48-hour MVP — the password
  reset flow generates a real token but returns the reset URL in the
  API response in non-production mode so the flow can be exercised.
- Browser PDF rendering uses a **CDN-hosted pdf.js worker** matching
  the bundled `pdfjs-dist` version, to avoid Webpack worker plumbing.
- A single Express instance is assumed for the MVP; horizontal scaling
  works once `storage/` is replaced with shared object storage.
- The default signer is the **logged-in user**. Multi-party signing
  / signature requests are out of scope.

---

## Known limitations

- **No email delivery** — password reset URLs are returned in API
  responses in dev mode for demonstration.
- **No PAdES / PKI**: signatures are visual + server-side hash-anchored,
  not cryptographically embedded into the PDF signature dictionary.
- **No virus scanning** of uploads. In production add ClamAV or a
  service like S3 + EventBridge → Lambda.
- **No background workers**: signing is synchronous and fits well within
  HTTP timeouts for typical PDFs, but very large multi-hundred-page
  files should be queued.
- **No real-time updates** on the dashboard — the SPA polls on mount.
- Cookies / refresh-token rotation are not implemented; the auth token
  lives in `localStorage` for the MVP.

---

## Future improvements

- **Real email** for password reset, notifications, signing requests
  (Resend / Mailgun / SES).
- **Multi-signer workflows**: send a document to N recipients, track
  per-recipient signature status.
- **Cryptographic signatures**: PAdES-B signature embedded into the PDF
  with a server-managed certificate.
- **Object storage** (S3-compatible) with presigned download URLs.
- **Background queue** (BullMQ) for signing + virus scanning.
- **Refresh tokens** + httpOnly cookies + CSRF protection.
- **WebAuthn** for second factor.
- **Better PDF rendering** with text selection + thumbnails sidebar.
- **Audit log export** (CSV / SIEM).
- **i18n** for the UI.

---

## License

MIT — built as a take-home demo.
