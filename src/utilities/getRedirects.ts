import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export async function getRedirects(depth = 1) {
  if (!process.env.DATABASE_URI) {
    return []
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const { docs: redirects } = await payload.find({
      collection: 'redirects',
      depth,
      limit: 0,
      pagination: false,
    })

    return redirects || []
  } catch (error) {
    console.warn('Failed to fetch redirects:', error)
    return []
  }
}

/**
 * Returns a unstable_cache function mapped with the cache tag for 'redirects'.
 *
 * Cache all redirects together to avoid multiple fetches.
 */
export const getCachedRedirects = () =>
  unstable_cache(async () => getRedirects(), ['redirects'], {
    tags: ['redirects'],
  })
