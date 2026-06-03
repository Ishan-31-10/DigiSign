import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import env from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import * as pdfService from './services/pdf.service.js';

import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import signatureRoutes from './routes/signature.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import adminRoutes from './routes/admin.routes.js';

async function bootstrap() {
  await connectDB();
  await pdfService.ensureUploadDirs();

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' })); // signatures can be large data URLs
  app.use(express.urlencoded({ extended: true }));
  app.use(
    mongoSanitize({
      replaceWith: '_',
      // express 5 / some setups expose req.query as a getter — replacing
      // properties on it throws. onSanitize keeps us safe + diagnostic.
      onSanitize: ({ key }) => {
        if (env.isDev) {
          // eslint-disable-next-line no-console
          console.warn(`[security] sanitized key: ${key}`);
        }
      },
    })
  );

  if (!env.isProd) app.use(morgan('dev'));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.nodeEnv }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: env.nodeEnv }));

  // Rate limiting for sensitive endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/signatures', signatureRoutes);
  app.use('/api/verify', verificationRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] DigSign API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[fatal]', err);
  process.exit(1);
});
