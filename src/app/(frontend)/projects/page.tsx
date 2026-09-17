import type { Metadata } from 'next/types'

import { ProjectArchive } from '@/components/ProjectArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { ProjectsFilter } from '@/components/ProjectsFilter'
import configPromise from '@payload-config'
import { getPayload, PaginatedDocs } from 'payload'
import React from 'react'
import PageClient from './page.client'
import type { Tag, Location } from '@/payload-types'

import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'
export const revalidate = 600

type SearchParams = {
  q?: string
  tag?: string
  location?: string
  status?: string
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  if (shouldSkipDbAccess()) {
    return (
      <div className="pt-24 pb-24">
        <PageClient />
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Projects</h1>
          </div>
        </div>
        <ProjectArchive projects={[]} />
      </div>
    )
  }

  const { q, tag, location, status } = await searchParams
  const payload = await getPayload({ config: configPromise })

  // Fetch tags and locations for filter dropdowns
  const [tagsResult, locationsResult] = await Promise.all([
    payload.find({
      collection: 'tags',
      limit: 1000,
      sort: 'title',
    }),
    payload.find({
      collection: 'locations',
      limit: 1000,
      sort: 'name',
    }),
  ])

  const tags: Tag[] = tagsResult.docs
  const locations: Location[] = locationsResult.docs

  // Construct where clause for filtering
  const whereClause: any = {}

  // Text search across multiple fields
  if (q) {
    whereClause.or = [
      {
        title: {
          contains: q,
        },
      },
      {
        'meta.description': {
          contains: q,
        },
      },
      {
        'meta.title': {
          contains: q,
        },
      },
    ]
  }

  // Filter by tag
  if (tag) {
    whereClause.tags = {
      contains: tag,
    }
  }

  // Filter by location
  if (location) {
    whereClause.location = {
      equals: location,
    }
  }

  // Filter by status
  if (status) {
    whereClause.status = {
      equals: status,
    }
  }

  const projects: PaginatedDocs = await payload.find({
    collection: 'projects',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    select: {
      id: true,
      title: true,
      slug: true,
      tags: true,
      meta: true,
      targetAmount: true,
      totalDonated: true,
      status: true,
      location: true,
      heroImage: true,
      donations: true,
      dueDate: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Projects</h1>
        </div>
      </div>

      <div className="container">
        <ProjectsFilter tags={tags} locations={locations} />
      </div>

      <div className="container mb-8">
        <PageRange
          collection="projects"
          currentPage={projects.page}
          limit={12}
          totalDocs={projects.totalDocs}
        />
      </div>

      {projects.docs && projects.docs.length > 0 ? (
        <ProjectArchive projects={projects.docs} />
      ) : (
        <div className="container">
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No projects found matching your criteria.
            </p>
          </div>
        </div>
      )}

      <div className="container">
        {projects.totalPages > 1 && projects.page && (
          <Pagination page={projects.page} totalPages={projects.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Africa Change Makers Projects`,
  }
}
