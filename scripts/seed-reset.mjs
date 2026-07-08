#!/usr/bin/env node
/**
 * Sets a flag in localStorage on next browser load to reset seed data.
 * Run: pnpm seed:reset — then reload the app in the browser.
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const flagPath = join(__dirname, '..', '.seed-reset-flag')

writeFileSync(flagPath, String(Date.now()))
console.log('Seed reset requested.')
console.log('Reload the app in your browser, or open Platform → Reset demo data.')
