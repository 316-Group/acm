import type { Metadata } from 'next'
import React from 'react'

import { getPayload } from 'payload'
import config from '@payload-config'
import { PetitionArchive } from '@/components/PetitionArchive'
import type { Page, Petition } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'

import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'

export default async function PetitionsPage() {
  if (shouldSkipDbAccess()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Petitions</h1>
          <p className="text-lg text-muted-foreground">
            Support causes that matter to you. Browse and sign petitions to make your voice heard.
          </p>
        </div>
        <PetitionArchive petitions={[]} />
      </div>
    )
  }

  const payload = await getPayload({ config })

  const petitions = await payload.find({
    collection: 'petitions',
    depth: 1,
    limit: 12,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Petitions</h1>
        <p className="text-lg text-muted-foreground">
          Support causes that matter to you. Browse and sign petitions to make your voice heard.
        </p>
      </div>
      <PetitionArchive petitions={petitions.docs as Petition[]} />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const doc: Partial<Page> = {
    title: 'Petitions - Make Your Voice Heard',
    meta: {
      title: 'Petitions - Make Your Voice Heard',
      description:
        'Browse and support petitions that matter to you. Join thousands of others in making a difference.',
    },
  }

  return generateMeta({ doc })
}
