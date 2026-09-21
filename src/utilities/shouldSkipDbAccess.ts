export function shouldSkipDbAccess(): boolean {
  if (!process.env.DATABASE_URI) {
    return true
  }
  return false
}
