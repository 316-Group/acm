import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { shouldSkipDbAccess } from './shouldSkipDbAccess'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  if (shouldSkipDbAccess()) {
    console.log(`[getDocument] Skipping DB query for collection="${collection}", slug="${slug}".`)
    return null
  }

  try {
    console.log(`[getDocument] Querying collection="${collection}", slug="${slug}"...`)
    const payload = await getPayload({ config: configPromise })

    const page = await payload.find({
      collection,
      depth,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const doc = page.docs[0] || null
    console.log(`[getDocument] Query result for "${collection}/${slug}":`, doc ? `SUCCESS (Found ID: ${doc.id})` : 'NOT FOUND (0 docs)')
    return doc
  } catch (error) {
    console.warn(`[getDocument] Error fetching document ${collection}/${slug}:`, error)
    return null
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (collection: Collection, slug: string) => {
  if (shouldSkipDbAccess()) {
    return async () => getDocument(collection, slug)
  }
  return unstable_cache(async () => getDocument(collection, slug), [collection, slug], {
    tags: [`${collection}_${slug}`],
  })
}

