import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { shouldSkipDbAccess } from './shouldSkipDbAccess'

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0) {
  if (shouldSkipDbAccess()) {
    return {} as any
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const global = await payload.findGlobal({
      slug,
      depth,
    })

    return global || ({} as any)
  } catch (error) {
    console.warn(`Failed to fetch global ${slug}:`, error)
    return {} as any
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = (slug: Global, depth = 0) =>
  unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
