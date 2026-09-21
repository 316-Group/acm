import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { shouldSkipDbAccess } from './shouldSkipDbAccess'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  if (shouldSkipDbAccess()) {
    console.log(`[getDocument] ⏩ Skipping DB query for collection="${collection}", slug="${slug}" (build phase).`)
    return null
  }

  try {
    console.log(`[getDocument] 🔍 Querying collection="${collection}", slug="${slug}" from MongoDB Atlas...`)
    const payload = await getPayload({ config: configPromise })

    const page = await payload.find({
      collection,
      depth,
      overrideAccess: true,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const doc = page.docs[0] || null
    if (doc) {
      console.log(`[getDocument] ✅ SUCCESS: Found document in "${collection}" with slug="${slug}" (ID: ${doc.id})`)
    } else {
      console.warn(`[getDocument] ⚠️ NOT FOUND: No document in "${collection}" matched slug="${slug}"`)
    }
    return doc
  } catch (error: any) {
    console.error(`[getDocument] ❌ DATABASE ERROR fetching "${collection}/${slug}":`, error?.message || error)
    if (error?.stack) {
      console.error(`[getDocument] Stack snippet:`, String(error.stack).slice(0, 300))
    }
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

