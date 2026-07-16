import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { doubleCsrf } from 'csrf-csrf';

import metricsMiddleware from './middleware/metrics.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import categoryRoutes from './routes/category.routes.js';
import userRoutes from './routes/user.routes.js';
import readingListRoutes from './routes/readingList.routes.js';
import clubRoutes from './routes/club.routes.js';
import tagRoutes from './routes/tag.routes.js';
import adminRoutes from './routes/admin.routes.js';
import progressRoutes from './routes/progress.routes.js';
import commentRoutes from './routes/comment.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import { webhook as stripeWebhook } from './controllers/payments.controller.js';

import * as snapshotJob from './jobs/snapshotMetrics.job.js';
import * as badgeSweepJob from './jobs/badgeSweep.job.js';

// Meilisearch is excluded in test env to avoid network calls during tests
let configureIndex;
if (process.env.NODE_ENV !== 'test') {
  ({ configureIndex } = await import('./config/meilisearch.js'));
}

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // required for cookies to flow cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token'], // allow CSRF header
  })
);

// Stripe webhook must receive raw body — register before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET)); // signed cookies

// CSRF protection using the Double Submit Cookie pattern
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.COOKIE_SECRET,
  getSessionIdentifier: (req) =>
    req.cookies?.access_token ||
    req.cookies?.refresh_token ||
    `${req.ip || ''}:${req.headers['user-agent'] || ''}`,
  cookieName: 'csrf_token',
  cookieOptions: {
    httpOnly: false, // must be readable by JS so Axios can send it as a header
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => req.path === '/api/payments/webhook',
});

// Expose generateCsrfToken for the /csrf-token endpoint
app.set('generateCsrfToken', generateCsrfToken);
app.set('csrfProtection', doubleCsrfProtection);

app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// Configure Meilisearch index on startup (skipped in test env)
if (configureIndex) {
  configureIndex();
}

app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// API routes
app.use('/api/auth', doubleCsrfProtection, authRoutes);
app.use('/api/resources', doubleCsrfProtection, resourceRoutes);
app.use('/api/users', doubleCsrfProtection, userRoutes);
app.use('/api/lists', doubleCsrfProtection, readingListRoutes);
app.use('/api/clubs', doubleCsrfProtection, clubRoutes);
app.use('/api/tags', doubleCsrfProtection, tagRoutes);
app.use('/api/admin', doubleCsrfProtection, adminRoutes);
app.use('/api/progress', doubleCsrfProtection, progressRoutes);
app.use('/api', doubleCsrfProtection, commentRoutes);
app.use('/api/notifications', doubleCsrfProtection, notificationRoutes);
app.use('/api/payments', doubleCsrfProtection, paymentsRoutes);
app.use('/api', doubleCsrfProtection, reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/metrics', metricsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — must be last
app.use(errorHandler);

// Boot background workers and jobs (skipped during tests)
if (process.env.NODE_ENV !== 'test') {
  snapshotJob.start();
  badgeSweepJob.start();
  await import('./workers/email.worker.js');
  await import('./workers/search.worker.js');
  await import('./workers/thumbnail.worker.js');
  await import('./workers/notify.worker.js');
  await import('./workers/scan.worker.js');
}

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
