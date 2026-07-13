<img width="1792" height="592" alt="Gemini_Generated_Image_m4ygukm4ygukm4yg-clean" src="https://github.com/user-attachments/assets/bce941d4-fd2a-40bc-ba6d-46656e61fbc3" />


<h1 align="center">OpenShelf</h1>

<p align="center">
  An open-source platform for sharing, discovering, and discussing educational resources — books, courses, documents, exam papers, and audio.
</p>

<p align="center">
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-prerequisites">Prerequisites</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-environment-variables">Environment Variables</a> ·
  <a href="#%EF%B8%8F-database">Database</a> ·
  <a href="#-background-workers">Workers</a> ·
  <a href="#-api-reference">API Reference</a> ·
  <a href="#-admin-dashboard">Admin Dashboard</a> ·
  <a href="#-running-tests">Tests</a> ·
  <a href="#-deployment">Deployment</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

## Overview

OpenShelf is a full-stack open-source platform that lets contributors upload and share educational resources, while readers can browse, search, track reading progress, organise personal lists, and join reading clubs. The platform is self-hostable, MIT-licensed, and built with a strong focus on security, moderation, and observability.

**Key capabilities at a glance:**

- Upload books, courses, documents, exam papers, and audio files
- Full-text search powered by Meilisearch with a PostgreSQL `tsvector` fallback
- Reading clubs with threaded discussions
- Personal reading lists, bookmarks, and progress tracking
- Role-based access control (User / Moderator / Admin)
- Two-factor admin login with email OTP
- OAuth login via Google and GitHub
- Stripe-powered supporter subscription tiers
- Automated virus scanning with ClamAV on every upload
- Background job queues (BullMQ + Redis) for email, search sync, thumbnails, and notifications
- Prometheus metrics endpoint with real-time alert thresholds and a built-in monitoring dashboard
- Full audit log of staff actions

---

## 🛠 Tech Stack

### Frontend (`openshelf-web`)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React Compiler) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Animations | Motion (Framer Motion) |
| HTTP client | Axios |
| Toasts | goey-toast |
| Icons | Lucide React |
| Theming | next-themes |

### Backend (`openshelf-api`)

| Layer | Technology |
|---|---|
| Runtime | Node.js v22 |
| Framework | Express 5 |
| ORM | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Database | PostgreSQL 16 |
| Object storage | MinIO (S3-compatible) |
| Search | Meilisearch v1.10 + PostgreSQL `tsvector` fallback |
| Queue / workers | BullMQ + Redis 7 |
| Auth | JWT (access + refresh tokens) + Passport.js (OAuth) |
| CSRF | Double Submit Cookie pattern (`csrf-csrf`) |
| Email | Resend |
| Payments | Stripe |
| Virus scanning | ClamAV |
| Image processing | Sharp |
| Metrics | Prometheus (`prom-client`, `express-prom-bundle`) |
| Security | Helmet, `express-rate-limit`, bcryptjs, HIBP password check |

---

## 📁 Project Structure

The project lives in two separate repositories:

```
openshelf-api/                  # Express REST API
├── prisma/
│   ├── migrations/             # All Prisma migration files
│   ├── schema.prisma           # 20+ model Prisma schema
│   └── seed.js                 # Seed script for development data
├── src/
│   ├── app.js                  # Express app bootstrap
│   ├── config/                 # Service configs (Prisma, MinIO, Meilisearch, Redis, Passport, badges)
│   ├── controllers/            # Route handler logic
│   ├── jobs/                   # Scheduled jobs (metric snapshots, badge sweeps)
│   ├── middleware/             # Auth, CSRF, error handling, rate limiting, upload, validation
│   ├── queues/                 # BullMQ queue definitions
│   ├── routes/                 # Express routers
│   ├── scripts/                # One-off scripts (Meilisearch index sync)
│   ├── services/               # Business logic (auth, stripe, search, email, badges…)
│   ├── utils/                  # Helpers (audit logging, pagination, slug, cookie utils…)
│   └── workers/                # BullMQ workers (email, notify, scan, search, thumbnail)
├── __tests__/                  # Jest + Supertest tests
├── docker-compose.yml          # Postgres, MinIO, Meilisearch, Redis, ClamAV
├── .env.example
└── package.json

openshelf-web/                  # Next.js frontend
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth pages: login, register, verify-email, forgot/reset password, OAuth callback
│   │   └── (main)/             # App pages: browse, search, resource detail, clubs, lists, dashboard,
│   │                           #            user profile, settings, support, upload, admin panel
│   ├── components/
│   │   ├── admin/              # Admin dashboard components
│   │   ├── clubs/              # Discussion chat, club views
│   │   ├── contributor/        # Contributor dashboard
│   │   ├── landing/            # Landing page sections (Hero, Features, CTA…)
│   │   ├── layout/             # Navbar, notification bell, search bar
│   │   ├── lists/              # Reading list components
│   │   ├── profile/            # User profile, badge list
│   │   ├── resource/           # Resource cards, detail, upload form, PDF viewer, audio player…
│   │   ├── search/             # Search filters, result cards
│   │   ├── settings/           # Settings sections (profile, security, subscription, notifications…)
│   │   ├── support/            # Support / pricing page
│   │   └── ui/                 # Shared UI (Pagination, Toaster)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # API client, server API helpers, error handling, HIBP, utils
│   ├── store/                  # Zustand auth store
│   └── types/                  # Shared TypeScript types
├── .env.example
└── package.json
```

---

## ✅ Prerequisites

Make sure the following are installed before you begin:

- **Node.js** v22+ and **npm**
- **Docker** and **Docker Compose** (for running Postgres, MinIO, Meilisearch, Redis, and ClamAV locally)
- **Git**

> **Windows users:** The project is actively developed on Windows. All commands below work in PowerShell or Git Bash.

---

## 🚀 Getting Started

### 1. Clone the repositories

```bash
git clone git@github.com:ayomalbanneka/openshelf.git
```

### 2. Start the infrastructure services

From the `openshelf-api` directory, bring up all backing services with Docker Compose:

```bash
cd openshelf-api
docker compose up -d
```

This starts:

| Service | Port | Notes |
|---|---|---|
| PostgreSQL 16 | `5433` | Main database |
| MinIO | `9000` / `9001` | Object storage (console at `:9001`) |
| Meilisearch | `7700` | Full-text search engine |
| Redis 7 | `6379` | BullMQ queue backend |
| ClamAV | `3310` | Virus scanner — takes ~2 min on first run to download signatures |

> **MinIO bucket:** The `minio_init` container automatically creates the `openshelf` bucket and sets it to public-download access on first boot.

### 3. Set up the API

```bash
cd openshelf-api
npm install
cp .env.example .env
# → Edit .env with your values (see Environment Variables below)

npm run db:migrate      # Run all Prisma migrations
npm run db:generate     # Generate the Prisma client
npm run db:seed         # Seed the database with demo data
npm run dev             # Start the API in dev mode (nodemon)
```

The API will be available at `http://localhost:4000`.

### 4. Set up the frontend

```bash
cd openshelf-web
npm install
cp .env.example .env.local
# → Edit .env.local with your values (see Environment Variables below)

npm run dev             # Start the Next.js dev server
```

The frontend will be available at `http://localhost:3000`.

### 5. Sync Meilisearch (optional but recommended)

If you seeded data or already have resources in the database, sync them into Meilisearch:

```bash
cd openshelf-api
npm run search:sync
```

---

## 🔐 Environment Variables

### API — `openshelf-api/.env`

```env
# Server
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
WEB_URL=http://localhost:3000
API_URL=http://localhost:4000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/openshelf_db"

# Seed passwords (used only by prisma/seed.js)
SEED_ADMIN_PASSWORD=
SEED_DEMO_PASSWORD=

# JWT
JWT_SECRET=your_jwt_access_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Cookie signing (also used as CSRF secret)
COOKIE_SECRET=your_cookie_secret_here

# MinIO / S3-compatible storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=openshelf
STORAGE_REGION=ap-southeast-1
STORAGE_PUBLIC_URL=http://localhost:9000/openshelf

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=changeme_master_key

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe (optional — required for supporter subscriptions)
STRIPE_SECRET_KEY=
STRIPE_SUPPORTER_PRICE_ID=
STRIPE_PATRON_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# Redis
REDIS_URL=redis://localhost:6379

# ClamAV
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310

# Monitoring alert thresholds (admin email alerts)
ALERT_ERROR_RATE_PCT=5
ALERT_P95_MS=2000
ALERT_MEMORY_PCT=85
ALERT_DB_LATENCY_MS=500
ALERT_COOLDOWN_MINUTES=30
ALERT_RECIPIENT_EMAILS=admin@yourdomain.com
```

### Frontend — `openshelf-web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_NAME=OpenShelf
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Database

OpenShelf uses **PostgreSQL 16** with **Prisma 7** as the ORM.

> **Important:** Prisma 7 requires the `@prisma/adapter-pg` driver adapter. The `prisma/schema.prisma` does not use the `url` field in `datasource db` directly — the connection is established in `src/config/prisma.js` using the adapter. Do not remove or bypass the adapter setup.

### Schema overview

The Prisma schema defines 20+ models. The main ones are:

| Model | Description |
|---|---|
| `User` | Platform accounts. Supports local auth and OAuth (Google, GitHub). Roles: `USER`, `MODERATOR`, `ADMIN`. |
| `Resource` | The core content model. Types: `BOOK`, `COURSE`, `EXAM_PAPER`, `DOCUMENT`, `AUDIO`. Includes a `tsvector` column for PostgreSQL full-text search. |
| `Category` | Self-referencing tree (parent/child categories). |
| `Tag` / `ResourceTag` | Many-to-many tag system. |
| `Lesson` | Ordered lessons belonging to a `COURSE` resource. |
| `ExamPaper` | Metadata extension for `EXAM_PAPER` resources (subject, year, grade, institution). |
| `Submission` | User submissions against exam papers. |
| `Review` | One star-rating + comment per user per resource. |
| `ReadingProgress` | Per-user, per-resource progress tracking (current page, percentage, completed). |
| `ReadingList` / `ReadingListItem` | User-curated ordered lists of resources. |
| `Bookmark` | Quick-save a resource for later. |
| `Club` / `ClubMember` / `ClubDiscussion` | Reading clubs with role-based membership (`OWNER`, `MODERATOR`, `MEMBER`). |
| `Comment` | Threaded comments on resources and club discussions. |
| `Report` | User-submitted content reports with moderation workflow. |
| `Notification` | In-app notifications (new follower, comment, published/rejected resource, club invite). |
| `Subscription` | Stripe-backed supporter tiers (`SUPPORTER`, `PATRON`). |
| `RefreshToken` | Hashed refresh tokens for secure JWT rotation. |
| `StaffInvite` | Email-based invite flow for onboarding moderators and admins. |
| `EmailVerification` | OTP codes for email verification and admin 2FA. |
| `AuditLog` | Immutable log of all admin and moderator actions. |
| `MetricSnapshot` | Time-series performance snapshots (RPM, error rate, p95 latency, memory, DB latency). |
| `AlertState` | Tracks which metric alert thresholds are currently breached, with cooldown logic. |

### Common database commands

```bash
# Apply pending migrations
npm run db:migrate

# Re-generate the Prisma client after schema changes
npm run db:generate

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Seed the database with demo categories, users, and resources
npm run db:seed
```

### Adding a migration

After editing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe_your_change
```

---

## ⚙️ Background Workers

The API runs five BullMQ workers, all backed by Redis. They start automatically when `NODE_ENV !== 'test'`.

| Worker | Queue | What it does |
|---|---|---|
| `email.worker.js` | `email` | Sends transactional emails via Resend |
| `notify.worker.js` | `notify` | Creates in-app notifications (new follower, comments, publish status) |
| `scan.worker.js` | `scan` | Downloads uploaded files from MinIO and scans them with ClamAV. Marks resources as `CLEAN`, `INFECTED`, or `ERROR`. Infected files are moved to a quarantine prefix in MinIO. |
| `search.worker.js` | `search` | Indexes new or updated resources in Meilisearch |
| `thumbnail.worker.js` | `thumbnail` | Generates thumbnails for uploaded resources using Sharp |

### Scheduled jobs

| Job | Schedule | What it does |
|---|---|---|
| `snapshotMetrics.job.js` | Every minute | Captures a `MetricSnapshot` row (RPM, error rate, p95, memory, DB latency) and triggers email alerts when thresholds are breached |
| `badgeSweep.job.js` | Periodic | Evaluates all users against badge criteria and awards any newly earned badges |

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Every mutating endpoint requires a valid `x-csrf-token` header — fetch a token first from `GET /api/csrf-token`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a new user account |
| `POST` | `/api/auth/login` | — | Log in (returns access + refresh tokens as HttpOnly cookies) |
| `POST` | `/api/auth/logout` | ✓ | Revoke the current refresh token |
| `POST` | `/api/auth/refresh` | — | Exchange a valid refresh token for a new access token |
| `POST` | `/api/auth/verify-email` | ✓ | Verify email with a 6-digit OTP code |
| `POST` | `/api/auth/resend-code` | ✓ | Resend the email verification code |
| `POST` | `/api/auth/forgot-password` | — | Request a password reset code |
| `POST` | `/api/auth/reset-password` | — | Reset password using the 6-digit code |
| `POST` | `/api/auth/admin/login` | — | Step 1 of admin login (password check) |
| `POST` | `/api/auth/admin/verify` | — | Step 2 of admin login (email OTP) |
| `GET` | `/api/auth/google` | — | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | — | Google OAuth callback |
| `GET` | `/api/auth/github` | — | Initiate GitHub OAuth flow |
| `GET` | `/api/auth/github/callback` | — | GitHub OAuth callback |

### Resources

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources` | — | List published resources (filterable by type, category, language, tags, sort) |
| `GET` | `/api/resources/search` | — | Full-text search (Meilisearch with PostgreSQL fallback) |
| `GET` | `/api/resources/:slug` | — | Get a single resource by slug |
| `POST` | `/api/resources` | ✓ | Upload a new resource (multipart/form-data) |
| `PUT` | `/api/resources/:id` | ✓ | Update own resource metadata |
| `DELETE` | `/api/resources/:id` | ✓ | Delete own resource |
| `POST` | `/api/resources/:id/reviews` | ✓ | Submit a star rating and review |
| `PUT` | `/api/resources/:id/reviews` | ✓ | Update own review |
| `DELETE` | `/api/resources/:id/reviews` | ✓ | Delete own review |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✓ | Get the authenticated user's profile |
| `PATCH` | `/api/users/me` | ✓ | Update profile (name, bio, avatar, country, language, website) |
| `PATCH` | `/api/users/me/password` | ✓ | Change password |
| `GET` | `/api/users/:id` | — | Get a public user profile |
| `POST` | `/api/users/:id/follow` | ✓ | Follow a user |
| `DELETE` | `/api/users/:id/follow` | ✓ | Unfollow a user |
| `GET` | `/api/users/:id/resources` | — | List a user's uploaded resources |

### Reading Lists

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/lists` | ✓ | Get the authenticated user's reading lists |
| `POST` | `/api/lists` | ✓ | Create a new reading list |
| `PUT` | `/api/lists/:id` | ✓ | Update a reading list |
| `DELETE` | `/api/lists/:id` | ✓ | Delete a reading list |
| `POST` | `/api/lists/:id/items` | ✓ | Add a resource to a list |
| `DELETE` | `/api/lists/:id/items/:resourceId` | ✓ | Remove a resource from a list |

### Progress & Bookmarks

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/progress` | ✓ | Get all reading progress for the authenticated user |
| `PUT` | `/api/progress/:resourceId` | ✓ | Update reading progress for a resource |
| `POST` | `/api/resources/:id/bookmark` | ✓ | Bookmark a resource |
| `DELETE` | `/api/resources/:id/bookmark` | ✓ | Remove a bookmark |

### Clubs

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/clubs` | — | List public clubs |
| `POST` | `/api/clubs` | ✓ | Create a club |
| `GET` | `/api/clubs/:slug` | — | Get club details and members |
| `DELETE` | `/api/clubs/:id` | ✓ | Delete a club (owner only) |
| `POST` | `/api/clubs/:slug/join` | ✓ | Join a club |
| `DELETE` | `/api/clubs/:slug/leave` | ✓ | Leave a club |
| `GET` | `/api/clubs/:slug/discussions` | — | List discussions in a club |
| `POST` | `/api/clubs/:slug/discussions` | ✓ | Create a new discussion |

### Comments

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources/:id/comments` | — | Get comments on a resource |
| `POST` | `/api/resources/:id/comments` | ✓ | Post a comment (supports `parentId` for threading) |
| `DELETE` | `/api/comments/:id` | ✓ | Delete own comment |

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✓ | Get notifications for the authenticated user |
| `PATCH` | `/api/notifications/:id/read` | ✓ | Mark a notification as read |
| `PATCH` | `/api/notifications/read-all` | ✓ | Mark all notifications as read |

### Payments (Stripe)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/checkout` | ✓ | Create a Stripe Checkout session for a subscription tier |
| `POST` | `/api/payments/portal` | ✓ | Create a Stripe Billing Portal session |
| `GET` | `/api/payments/subscription` | ✓ | Get the current user's subscription status |
| `POST` | `/api/payments/webhook` | — | Stripe webhook endpoint (raw body, no CSRF) |

### Categories & Tags

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | — | List all categories (tree structure) |
| `GET` | `/api/tags` | — | List all tags |

### Metrics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/metrics` | — | Prometheus metrics scrape endpoint |
| `GET` | `/api/metrics/live` | Admin | Live performance metrics |
| `GET` | `/api/metrics/history` | Admin | Historical metric snapshots |
| `GET` | `/api/metrics/alerts` | Admin | Current alert threshold state |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", env: "..." }` |
| `GET` | `/api/csrf-token` | Returns a CSRF token — call this before any mutating request |

---

## 🛡️ Admin Dashboard

The admin dashboard is accessible at `/admin` and is protected by the two-step login flow (`/admin/login` → email OTP → session). Access requires an `ADMIN` or `MODERATOR` role.

### Admin pages

| Page | Role required | Description |
|---|---|---|
| `/admin` | ADMIN / MOD | Dashboard with platform-wide statistics |
| `/admin/pending` | ADMIN / MOD | Review and publish or reject uploaded resources |
| `/admin/resources` | ADMIN | Browse and manage all published resources |
| `/admin/quarantine` | ADMIN | Resources flagged as infected or scan errors by ClamAV |
| `/admin/users` | ADMIN | View, activate/deactivate, and update user roles |
| `/admin/clubs` | ADMIN | Browse and delete clubs |
| `/admin/categories` | ADMIN | Create and delete categories |
| `/admin/tags` | ADMIN | Manage tags |
| `/admin/staff` | ADMIN | Invite moderators and admins via email, revoke access |
| `/admin/reports` | ADMIN / MOD | Review user-submitted content reports |
| `/admin/audit` | ADMIN | Full immutable audit log of all staff actions |
| `/admin/monitoring` | ADMIN | Real-time performance monitoring with alerting thresholds |

### Role permissions summary

| Action | USER | MODERATOR | ADMIN |
|---|---|---|---|
| Upload resources | ✓ | ✓ | ✓ |
| Publish / reject resources | — | ✓ | ✓ |
| Bulk publish / reject | — | ✓ | ✓ |
| Delete any resource | — | — | ✓ |
| Manage users | — | — | ✓ |
| Manage categories & tags | — | — | ✓ |
| Manage staff | — | — | ✓ |
| View audit log | — | — | ✓ |
| View monitoring | — | — | ✓ |
| Review reports | — | ✓ | ✓ |

### Staff invite flow

Admins can invite new moderators or admins by email from `/admin/staff`. The invitee receives an email with a signed invite link that leads to `/admin/accept-invite`, where they set their password and activate their account. Invites expire after 24 hours.

---

## 🧪 Running Tests

```bash
cd openshelf-api
npm test
```

Tests use **Jest** and **Supertest** against the Express app. The test environment mocks Meilisearch and uses an isolated database connection. The test suite covers health checks and CSRF token validation.

```bash
# Run tests in watch mode during development
npx jest --watch
```

---

## 🔒 Security Notes

- **CSRF protection** — The Double Submit Cookie pattern is applied to all mutating API endpoints. Every frontend request fetches a `csrfToken` from `GET /api/csrf-token` and sends it as the `x-csrf-token` header. The Stripe webhook endpoint is explicitly exempted.
- **Rate limiting** — Auth endpoints are rate-limited: 10 requests / 15 min for registration and login, 5 requests / hour for admin login, 10 OTP attempts / 30 min.
- **JWT storage** — Access tokens are stored in `HttpOnly`, `Secure` cookies (not `localStorage`). Refresh tokens are hashed in the database.
- **Admin 2FA** — Admin login requires a two-step flow: password + a time-limited email OTP.
- **Virus scanning** — Every uploaded file is queued for ClamAV scanning immediately after upload. Until the scan completes, resources remain in a `PENDING` scan state. Infected files are moved to quarantine storage and the resource is flagged in the admin panel.
- **File type validation** — MIME types are validated from the file's actual bytes using `file-type`, not just the file extension.
- **HIBP integration** — Passwords are checked against the Have I Been Pwned breached-password database during registration and password changes.
- **Helmet** — HTTP security headers are set on all responses.

---

## 📊 Monitoring & Alerting

OpenShelf exposes a Prometheus-compatible `/metrics` endpoint and captures minute-by-minute metric snapshots in the database.

### Alert thresholds

Configured via environment variables:

| Variable | Default | Description |
|---|---|---|
| `ALERT_ERROR_RATE_PCT` | `5` | Alert when HTTP error rate exceeds this percentage |
| `ALERT_P95_MS` | `2000` | Alert when p95 response latency exceeds this in ms |
| `ALERT_MEMORY_PCT` | `85` | Alert when system memory usage exceeds this percentage |
| `ALERT_DB_LATENCY_MS` | `500` | Alert when database query latency exceeds this in ms |
| `ALERT_COOLDOWN_MINUTES` | `30` | Minimum minutes between repeated alerts for the same metric |
| `ALERT_RECIPIENT_EMAILS` | — | Comma-separated list of emails to receive alert notifications |

When a threshold is breached, the system sends an alert email and records the breach in `AlertState`. Alerts respect the cooldown period to prevent email flooding. The admin monitoring dashboard shows the live state and history charts.

---

## 🚢 Deployment

### API (Node.js)

The API is a standard Node.js/Express app. You can deploy it to any platform that runs Node.js 22+: a VPS, Railway, Render, Fly.io, etc.

```bash
# Production start
npm start
```

For production, ensure:
- `NODE_ENV=production` is set
- All environment variables are configured (especially `COOKIE_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`)
- Your MinIO instance (or S3-compatible storage) is reachable from the API
- ClamAV is running and reachable at `CLAMAV_HOST:CLAMAV_PORT`
- Redis is running and reachable at `REDIS_URL`

### Frontend (Next.js)

```bash
npm run build
npm start
```

The frontend can be deployed to Vercel, Netlify, or any Node.js host. Set the environment variables in your hosting provider's dashboard.

### Stripe webhook (production)

In production you must register your webhook endpoint with Stripe. Point it to `https://yourdomain.com/api/payments/webhook` and subscribe to these events:

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

Copy the webhook signing secret from the Stripe dashboard and set it as `STRIPE_WEBHOOK_SECRET`.

### OAuth callbacks (production)

Register the following redirect URIs in your Google Cloud Console and GitHub OAuth App settings:

```
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com/api/auth/github/callback
```

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes. Keep commits focused and write clear commit messages.
3. Run the test suite before opening a PR:
   ```bash
   npm test
   ```
4. Open a pull request against `main` with a clear description of what was changed and why.

### Code conventions

- **API:** CommonJS modules, camelCase throughout, `authenticate` always followed by `authorize` in route middleware chains. Use `cuid()` for all new IDs.
- **Frontend:** TypeScript strict mode. Components live in `src/components/`, pages in `src/app/`. Avoid putting business logic directly in page components — extract it into components or hooks.
- **Database:** Always create a migration for schema changes. Never edit existing migration files.

---

## 📄 License

OpenShelf is open-source software licensed under the [MIT License](LICENSE).
