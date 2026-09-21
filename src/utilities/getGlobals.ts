import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { shouldSkipDbAccess } from './shouldSkipDbAccess'

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0) {
  if (shouldSkipDbAccess()) {
    console.log(`[getGlobal] Skipping DB query for global slug="${slug}".`)
    return {} as any
  }

  try {
    console.log(`[getGlobal] Querying global slug="${slug}"...`)
    const payload = await getPayload({ config: configPromise })

    const global = await payload.findGlobal({
      slug,
      depth,
    })

    console.log(`[getGlobal] Query result for global "${slug}":`, global ? `SUCCESS (Keys: ${Object.keys(global).join(', ')})` : 'EMPTY ({})')
    return global || ({} as any)
  } catch (error) {
    console.warn(`[getGlobal] Error fetching global ${slug}:`, error)
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

