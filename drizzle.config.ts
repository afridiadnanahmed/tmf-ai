import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env.local for local development, .env for production
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});