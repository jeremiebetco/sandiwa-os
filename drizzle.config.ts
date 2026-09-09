import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config()

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_ADMIN
      || process.env.DATABASE_URL
      || 'postgresql://sandiwa:sandiwa@localhost:5433/sandiwa_os'
  },
  strict: true,
  verbose: true
})
