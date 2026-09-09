import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { applyRlsSubstitutions, createPostgresClient, getDatabaseUrl } from './connection'

config()

const adminUrl = getDatabaseUrl('admin')

async function main() {
  const client = createPostgresClient(adminUrl, 1)
  const db = drizzle(client)

  console.log('Running Drizzle migrations...')
  await migrate(db, { migrationsFolder: './server/db/migrations' })

  // Apply RLS SQL after schema migrations (creates sandiwa_app + policies)
  const rlsDir = join(process.cwd(), 'server/db/rls')
  try {
    const files = readdirSync(rlsDir).filter(f => f.endsWith('.sql')).sort()
    for (const file of files) {
      const sqlText = applyRlsSubstitutions(readFileSync(join(rlsDir, file), 'utf8'))
      console.log(`Applying RLS: ${file}`)
      await client.unsafe(sqlText)
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    console.log('No RLS directory found — skipping')
  }

  await client.end()
  console.log('Migrations complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
