import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export function shouldSkipDbAccess(): boolean {
  if (
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return true
  }
  if (!process.env.DATABASE_URI) {
    return true
  }
  return false
}
