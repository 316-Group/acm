import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostsFilter } from '@/components/PostsFilter'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import type { Category, Location } from '@/payload-types'

import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 600

type Args = {
  searchParams: Promise<{
    q?: string
    category?: string
    location?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  if (shouldSkipDbAccess()) {
    return (
      <div className="pt-24 pb-24">
        <PageClient />
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Explore our <span className="text-orange-600">Activities</span></h1>
          </div>
        </div>
        <CollectionArchive posts={[]} />
      </div>
    )
  }

  const { q: query, category, location } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  // Fetch categories and locations for the filter dropdowns
  const [categoriesData, locationsData] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 100,
      pagination: false,
    }),
    payload.find({
      collection: 'locations',
      limit: 100,
      pagination: false,
    }),
  ])

  // Build the where clause for filtering
  const whereClause: any = {
    and: [],
  }

  // Add text search conditions
  if (query) {
    whereClause.and.push({
      or: [
        {
          title: {
            like: query,
          },
        },
        {
          'meta.description': {
            like: query,
          },
        },
        {
          'meta.title': {
            like: query,
          },
        },
        {
          slug: {
            like: query,
          },
        },
      ],
    })
  }

  // Add category filter
  if (category) {
    whereClause.and.push({
      categories: {
        in: [category],
      },
    })
  }

  // Add location filter
  if (location) {
    whereClause.and.push({
      location: {
        equals: location,
      },
    })
  }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      location: true,
      meta: true,
    },
    ...(whereClause.and.length > 0 ? { where: whereClause } : {}),
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>
            Explore our <span className="text-orange-600">Activities</span>{' '}
          </h1>
        </div>
      </div>

      <div className="container mb-8">
        <PostsFilter
          categories={categoriesData.docs as Category[]}
          locations={locationsData.docs as Location[]}
        />
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs} />
      ) : (
        <div className="container">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found matching your criteria.</p>
          </div>
        </div>
      )}

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Africa Change Makers Posts`,
  }
}
