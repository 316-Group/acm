import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export function shouldSkipDbAccess(): boolean {
  if (
    process.env.NEXT_BUILD === 'true' ||
    process.env.IS_BUILD === 'true' ||
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return true
  }
  if (!process.env.DATABASE_URI) {
    console.warn('[DB CHECK] WARNING: process.env.DATABASE_URI is missing or empty! Skipping DB access.')
    return true
  }
  return false
}

