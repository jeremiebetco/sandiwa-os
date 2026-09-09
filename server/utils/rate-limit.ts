type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Best-effort in-memory rate limiter (per server instance).
 * Returns false when the caller should respond with HTTP 429.
 */
export function consumeRateLimit(key: string, opts: {
  limit: number
  windowMs: number
}): boolean {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return true
  }

  if (existing.count >= opts.limit) {
    return false
  }

  existing.count += 1
  return true
}

/** Test helper — clear buckets between cases. */
export function clearRateLimitBuckets() {
  buckets.clear()
}
