import { NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getDiagnosticLogs, addDiagnosticLog } from '@/utilities/diagnosticLogger'
import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()
  const rawDbUri = process.env.DATABASE_URI || ''
  const maskedDbUri = rawDbUri
    ? rawDbUri.replace(/:[^:@]+@/, ':****@')
    : 'MISSING - process.env.DATABASE_URI is not set in environment!'

  const envAudit = {
    DATABASE_URI: maskedDbUri,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? '✅ Configured (set)' : '❌ MISSING (using default fallback)',
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_BUILD: process.env.NEXT_BUILD || 'false',
    IS_BUILD: process.env.IS_BUILD || 'false',
  }

  let dbStatus: 'connected' | 'error' | 'skipped' = 'skipped'
  let dbError: string | null = null
  let latencyMs = 0
  const collectionCounts: Record<string, number | string> = {}

  if (shouldSkipDbAccess()) {
    dbStatus = 'skipped'
    dbError = 'Database access skipped due to missing DATABASE_URI or build phase flag.'
    addDiagnosticLog('warn', 'DIAGNOSTICS_API', 'DB check skipped by shouldSkipDbAccess()')
  } else {
    try {
      const payload = await getPayload({ config: configPromise })
      
      const [pages, posts, projects, users, petitions] = await Promise.all([
        payload.find({ collection: 'pages', limit: 1, overrideAccess: true }).catch((e) => ({ totalDocs: `ERR: ${e?.message}` })),
        payload.find({ collection: 'posts', limit: 1, overrideAccess: true }).catch((e) => ({ totalDocs: `ERR: ${e?.message}` })),
        payload.find({ collection: 'projects', limit: 1, overrideAccess: true }).catch((e) => ({ totalDocs: `ERR: ${e?.message}` })),
        payload.find({ collection: 'users', limit: 1, overrideAccess: true }).catch((e) => ({ totalDocs: `ERR: ${e?.message}` })),
        payload.find({ collection: 'petitions', limit: 1, overrideAccess: true }).catch((e) => ({ totalDocs: `ERR: ${e?.message}` })),
      ])

      latencyMs = Date.now() - startTime
      dbStatus = 'connected'

      collectionCounts.pages = typeof pages.totalDocs === 'number' ? pages.totalDocs : String(pages.totalDocs)
      collectionCounts.posts = typeof posts.totalDocs === 'number' ? posts.totalDocs : String(posts.totalDocs)
      collectionCounts.projects = typeof projects.totalDocs === 'number' ? projects.totalDocs : String(projects.totalDocs)
      collectionCounts.users = typeof users.totalDocs === 'number' ? users.totalDocs : String(users.totalDocs)
      collectionCounts.petitions = typeof petitions.totalDocs === 'number' ? petitions.totalDocs : String(petitions.totalDocs)

      addDiagnosticLog('info', 'DIAGNOSTICS_API', `DB ping successful (${latencyMs}ms). Pages: ${collectionCounts.pages}, Posts: ${collectionCounts.posts}, Projects: ${collectionCounts.projects}`)
    } catch (err: any) {
      latencyMs = Date.now() - startTime
      dbStatus = 'error'
      dbError = err?.message || String(err)
      addDiagnosticLog('error', 'DIAGNOSTICS_API', `DB ping failed: ${dbError}`, err?.stack)
    }
  }

  const logs = getDiagnosticLogs()

  const overallStatus = dbStatus === 'connected' ? 'healthy' : dbStatus === 'skipped' ? 'warning' : 'error'

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latencyMs,
      env: envAudit,
      database: {
        status: dbStatus,
        error: dbError,
        collections: collectionCounts,
      },
      logsCount: logs.length,
      logs,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
