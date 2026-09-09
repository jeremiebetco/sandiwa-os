import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import { createPostgresClient, getDatabaseUrl } from './connection'

const connectionString = getDatabaseUrl('app')

// Prefer a single connection for serverless / local Nitro; max 10 for local Docker.
const globalForDb = globalThis as unknown as {
  sandiwaSql?: ReturnType<typeof createPostgresClient>
  sandiwaDb?: ReturnType<typeof drizzle<typeof schema>>
}

function createClient() {
  const client = createPostgresClient(connectionString)
  const db = drizzle(client, { schema })
  return { client, db }
}

const instances = globalForDb.sandiwaDb
  ? { client: globalForDb.sandiwaSql!, db: globalForDb.sandiwaDb }
  : createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sandiwaSql = instances.client
  globalForDb.sandiwaDb = instances.db
}

export const sqlClient = instances.client
export const db = instances.db

export type Db = typeof db
export type OrgContext = {
  organizationId: string
  role?: string
  userId?: string
}

/**
 * Run work inside a transaction with RLS session variables set via SET LOCAL.
 * Safe behind connection poolers because LOCAL is transaction-scoped.
 */
export async function withOrgContext<T>(
  ctx: OrgContext,
  fn: (tx: Db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.organizationId}, true)`)
    if (ctx.role) {
      await tx.execute(sql`SELECT set_config('app.current_user_role', ${ctx.role}, true)`)
    }
    if (ctx.userId) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`)
    }
    return fn(tx as unknown as Db)
  })
}

/** Platform admin queries — full org directory access. */
export async function withPlatformContext<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', '', true)`)
    await tx.execute(sql`SELECT set_config('app.is_platform_admin', 'true', true)`)
    return fn(tx as unknown as Db)
  })
}

/** Public tenant resolution — read active organizations only. */
export async function withPublicRead<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.public_read', 'true', true)`)
    return fn(tx as unknown as Db)
  })
}
