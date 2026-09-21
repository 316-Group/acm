import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const url = '/' + slug

  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page })
}

import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  if (shouldSkipDbAccess()) {
    console.log(`[queryPageBySlug] Skipping DB query for slug="${slug}".`)
    return null
  }

  try {
    console.log(`[queryPageBySlug] Querying page with slug="${slug}"...`)
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const foundPage = result.docs?.[0] || null
    console.log(`[queryPageBySlug] Result for page slug="${slug}":`, foundPage ? `FOUND (Title: "${foundPage.title}")` : 'NOT FOUND (0 docs in DB)')
    return foundPage
  } catch (error) {
    console.warn(`[queryPageBySlug] Failed to query page by slug ${slug}:`, error)
    return null
  }
})
