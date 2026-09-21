import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const navItemsCount = headerData?.navItems?.length || 0
  console.log(`[Header Server Component] 🧭 Rendering Header with ${navItemsCount} navigation links.`)

  return <HeaderClient data={headerData} />
}
