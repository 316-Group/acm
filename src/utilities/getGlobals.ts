import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { shouldSkipDbAccess } from './shouldSkipDbAccess'

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0) {
  if (shouldSkipDbAccess()) {
    console.log(`[getGlobal] ⏩ Skipping DB query for global slug="${slug}" (build phase).`)
    return {} as any
  }

  try {
    console.log(`[getGlobal] 🔍 Querying global slug="${slug}" from MongoDB Atlas...`)
    const payload = await getPayload({ config: configPromise })

    const global = await payload.findGlobal({
      slug,
      depth,
    })

    if (!global) {
      console.warn(`[getGlobal] ⚠️ Database query returned null/empty for global slug="${slug}".`)
      return {} as any
    }

    const keys = Object.keys(global).filter((k) => k !== 'createdAt' && k !== 'updatedAt')
    console.log(`[getGlobal] ✅ SUCCESS: Retrieved global "${slug}" from DB! Fields: [${keys.join(', ')}]`)
    return global
  } catch (error: any) {
    console.error(`[getGlobal] ❌ DATABASE ERROR fetching global "${slug}":`, error?.message || error)
    if (error?.stack) {
      console.error(`[getGlobal] Stack snippet:`, String(error.stack).slice(0, 300))
    }
    return {} as any
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = (slug: Global, depth = 0) => {
  if (shouldSkipDbAccess()) {
    return async () => getGlobal(slug, depth)
  }
  return unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
}

