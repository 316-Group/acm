export function shouldSkipDbAccess(): boolean {
  const hasUri = Boolean(process.env.DATABASE_URI)
  if (!hasUri) {
    console.warn('[DB CHECK] WARNING: process.env.DATABASE_URI is missing or empty! Skipping DB access.')
    return true
  }
  return false
}
