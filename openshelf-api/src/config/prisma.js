import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/*
This file initializes the Prisma client with a PostgreSQL adapter.
It uses the connection string from the environment variable DATABASE_URL to connect to the database.
The Prisma client is configured to log queries, errors, and warnings in development mode, and only errors in production mode.
The initialized Prisma client is then exported for use in other parts of the application.
*/

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
