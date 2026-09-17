import type { Metadata } from 'next'
import { getPayload, PaginatedDocs } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Petition } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { PetitionHero } from './PetitionHero'
import { PetitionContent } from './PetitionContent'
import { PetitionComments } from './PetitionComments'
import { PetitionSupport } from './PetitionSupport'

interface Props {
  params: Promise<{
    slug: string
  }>
}

import { shouldSkipDbAccess } from '@/utilities/shouldSkipDbAccess'

export const dynamic = 'force-dynamic'

export default async function PetitionPage({ params }: Props) {
  if (shouldSkipDbAccess()) {
    notFound()
  }

  const { slug } = await params
  const payload = await getPayload({ config })

  const petition = await payload.find({
    collection: 'petitions',
    depth: 2,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
  // const commentsDocs: PaginatedDocs = await payload.find(
  //   {
  //     collection: 'comments',
  //     where: {
  //       parent: {
  //         equals: petition.docs[0].id,
  //       },
  //     },
  //   }
  // )

  if (!petition.docs.length) {
    notFound()
  }

  const petitionData = petition.docs[0] as Petition

  return (
    <div className="min-h-screen">
      <PetitionHero petition={petitionData} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PetitionContent petition={petitionData} />
            <div className="mt-8">
              <PetitionComments petitionId={petitionData.id} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PetitionSupport petition={petitionData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const petition = await payload.find({
    collection: 'petitions',
    depth: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const petitionData = petition.docs[0] as Petition

  return generateMeta({
    doc: petitionData,
  })
}
