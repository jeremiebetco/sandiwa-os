import { createHmac, scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { getSessionSecret } from './session-secret'

const scryptAsync = promisify(scrypt)
const KEYLEN = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  const hashBuf = Buffer.from(hash, 'hex')
  if (derived.length !== hashBuf.length) return false
  return timingSafeEqual(derived, hashBuf)
}

/** HMAC-SHA256 of session token using SESSION_SECRET (not reversible without the secret). */
export function hashToken(token: string): string {
  return createHmac('sha256', getSessionSecret()).update(token).digest('hex')
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}
