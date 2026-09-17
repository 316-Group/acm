import type { Post, Project, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload, PaginatedDocs } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { ProjectArchive } from '@/components/ProjectArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, tags, introContent, limit: limitFromProps, populateBy, selectedDocs, relationTo } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []
  let projects: Project[] = []

  if (populateBy === 'collection' && process.env.DATABASE_URI) {
    try {
      const payload = await getPayload({ config: configPromise })

      if (relationTo === 'posts') {
        const flattenedCategories = categories?.map((category) => {
          if (typeof category === 'object') return category.id
          else return category
        })

        const fetchedPosts = await payload.find({
          collection: 'posts',
          depth: 1,
          limit,
          ...(flattenedCategories && flattenedCategories.length > 0
            ? {
                where: {
                  categories: {
                    in: flattenedCategories,
                  },
                },
              }
            : {}),
        })

        posts = fetchedPosts.docs
      } else if (relationTo === 'projects') {
        const flattenedTags = tags?.map((tag) => {
          if (typeof tag === 'object') return tag.id
          else return tag
        })

        const fetchedProjects: PaginatedDocs = await payload.find({
          collection: 'projects',
          depth: 1,
          limit,
          select: {
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
          ...(flattenedTags && flattenedTags.length > 0
            ? {
                where: {
                  tags: {
                    in: flattenedTags,
                  },
                },
              }
            : {}),
        })

        projects = fetchedProjects.docs
      }
    } catch (error) {
      console.warn('Failed to populate ArchiveBlock collection:', error)
    }
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedDocs = selectedDocs.map((doc) => {
        if (typeof doc.value === 'object') return doc.value
      })

      // Separate posts and projects
      posts = filteredSelectedDocs.filter((doc) => doc && 'categories' in doc) as Post[]
      projects = filteredSelectedDocs.filter((doc) => doc && 'targetAmount' in doc) as Project[]
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      {relationTo === 'posts' && <CollectionArchive posts={posts} />}
      {relationTo === 'projects' && <ProjectArchive projects={projects} />}
    </div>
  )
}
