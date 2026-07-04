require('dotenv').config()

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const metricsMiddleware = require('./middleware/metrics');

const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const errorHandler = require('./middleware/errorHandler');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const readingListRoutes = require('./routes/readingList.routes');
const clubRoutes = require('./routes/club.routes');
const tagRoutes = require('./routes/tag.routes');
const adminRoutes = require('./routes/admin.routes');
const progressRoutes = require('./routes/progress.routes');
const commentRoutes = require('./routes/comment.routes');
const metricsRoutes = require('./routes/metrics.routes');
const reportRoutes = require('./routes/report.routes');
const snapshotJob = require('./jobs/snapshotMetrics.job');
const notificationRoutes = require('./routes/notification.routes');
const paymentsRoutes = require('./routes/payments.routes');
const { webhook: stripeWebhook } = require('./controllers/payments.controller');
const { doubleCsrf } = require('csrf-csrf')

let configureIndex
if (process.env.NODE_ENV !== 'test') {
  ; ({ configureIndex } = require('./config/meilisearch'));
}

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,               // required for cookies to flow cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf-token'],  // allow CSRF header
}));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));  // signed cookies

// CSRF protection using the Double Submit Cookie pattern
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.COOKIE_SECRET,
  getSessionIdentifier: (req) => (
    req.cookies?.access_token
    || req.cookies?.refresh_token
    || `${req.ip || ''}:${req.headers['user-agent'] || ''}`
  ),
  cookieName: 'csrf_token',
  cookieOptions: {
    httpOnly: false,    // must be readable by JS so Axios can send it as a header
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
  res.json({ status: 'ok', env: process.env.NODE_ENV })
});

// Configure Meilisearch index on startup
if (configureIndex) {
  configureIndex();
}

app.get('/api/csrf-token', (req, res) => {
  const generateCsrfToken = app.get('generateCsrfToken');
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
  res.status(404).json({ message: 'Route not found' })
});

// Global error handler — must be last
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  snapshotJob.start();
}

if (process.env.NODE_ENV !== 'test') {
  snapshotJob.start()

  // Boot BullMQ workers — Phase 12
  require('./workers/email.worker')
  require('./workers/search.worker')
  require('./workers/thumbnail.worker')
  require('./workers/notify.worker')
}

module.exports = app

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  });
}