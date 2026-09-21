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
    console.log(`[queryPageBySlug] ⏩ Skipping DB query for slug="${slug}" (build phase).`)
    return null
  }

  try {
    console.log(`[queryPageBySlug] 🔍 Querying page with slug="${slug}" from MongoDB Atlas...`)
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
    if (foundPage) {
      console.log(`[queryPageBySlug] ✅ SUCCESS: Retrieved page slug="${slug}" (Title: "${foundPage.title}", Blocks: ${foundPage.layout?.length || 0})`)
    } else {
      console.warn(`[queryPageBySlug] ⚠️ NOT FOUND: Page slug="${slug}" not found in MongoDB Atlas.`)
    }
    return foundPage
  } catch (error: any) {
    console.error(`[queryPageBySlug] ❌ DATABASE ERROR querying page slug="${slug}":`, error?.message || error)
    if (error?.stack) {
      console.error(`[queryPageBySlug] Stack snippet:`, String(error.stack).slice(0, 300))
    }
    return null
  }
})
