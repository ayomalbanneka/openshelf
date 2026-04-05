# OpenShelf

OpenShelf is a monorepo for a community-driven educational platform.

- openshelf-web: Next.js frontend (App Router, TypeScript, Tailwind CSS)
- openshelf-api: Express API with Prisma and PostgreSQL

## Repository Structure

```text
OpenShelf/
├─ openshelf-api/
│  ├─ prisma/
│  ├─ src/
│  └─ package.json
├─ openshelf-web/
│  ├─ public/
│  ├─ src/
│  └─ package.json
└─ README.md
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Node.js, Express 5, Prisma 7, PostgreSQL
- Tooling: ESLint, Nodemon

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Quick Start

### 1. Install dependencies

```bash
cd openshelf-api
npm install

cd ../openshelf-web
npm install
```

### 2. Configure environment variables

Create these files from examples:

```powershell
Copy-Item openshelf-api/.env.example openshelf-api/.env
Copy-Item openshelf-web/.env.example openshelf-web/.env.local
```

macOS/Linux alternative:

```bash
cp openshelf-api/.env.example openshelf-api/.env
cp openshelf-web/.env.example openshelf-web/.env.local
```

Update openshelf-api/.env with your database connection:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/openshelf
```

Default frontend values (from openshelf-web/.env.example):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_NAME=OpenShelf
```

### 3. Prepare the database (Prisma)

```bash
cd openshelf-api
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run both apps

Run in separate terminals.

Backend:

```bash
cd openshelf-api
npm run dev
```

Frontend:

```bash
cd openshelf-web
npm run dev
```

### 5. Open the app

- Frontend: http://localhost:3000
- API health check: http://localhost:4000/health

## Available Scripts

### openshelf-api

- npm run dev: Start API with nodemon
- npm start: Start API in normal mode

### openshelf-web

- npm run dev: Start Next.js development server
- npm run build: Build production bundle
- npm start: Start production server
- npm run lint: Run ESLint

## Current API Endpoints

- GET /health
- GET /test-db

## Troubleshooting

- Prisma client errors:
	- Run npx prisma generate in openshelf-api.
- Database connection issues:
	- Verify DATABASE_URL points to a running PostgreSQL instance.
- CORS issues in local development:
	- Ensure openshelf-api/.env CLIENT_URL matches your frontend URL.

## Notes

- The API uses Prisma with the PostgreSQL adapter package @prisma/adapter-pg.
- If you change the Prisma schema, run:

```bash
cd openshelf-api
npx prisma migrate dev --name your_migration_name
```
- For production deployment, set NODE_ENV=production and ensure environment variables are properly configured.