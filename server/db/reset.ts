import { config } from 'dotenv'
import { createPostgresClient, getDatabaseUrl } from './connection'

config()

const url = getDatabaseUrl('admin')

async function main() {
  const client = createPostgresClient(url, 1)
  console.log('Dropping and recreating public schema...')
  await client.unsafe(`
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO CURRENT_USER;
    GRANT ALL ON SCHEMA public TO public;
  `)

  await client.unsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sandiwa_app') THEN
        GRANT USAGE ON SCHEMA public TO sandiwa_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sandiwa_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          GRANT USAGE, SELECT ON SEQUENCES TO sandiwa_app;
      END IF;
    END $$;
  `)
  await client.end()
  console.log('Schema reset. Run pnpm db:migrate && pnpm db:seed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
