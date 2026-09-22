// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { Donations } from './collections/Donations'
import { FAQ } from './collections/FAQ'
import { Locations } from './collections/Locations'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PetitionSupports } from './collections/PetitionSupports'
import { Petitions } from './collections/Petitions'
import { Posts } from './collections/Posts'
// import { Projects } from './collections/Projects'
import { Staff } from './collections/Staff'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Projects } from './collections/Projects'
import { shouldSkipDbAccess } from './utilities/shouldSkipDbAccess'
import { addDiagnosticLog } from './utilities/diagnosticLogger'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  csrf: [getServerSideURL(), process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(
    Boolean,
  ),
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
      graphics: {
        Logo: '@/components/Logo/Graphics',
        Icon: '@/components/Logo/Graphics',
      },
    },
    meta: {
      title: 'Africa Change Makers',
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/acmfavicon.png`,
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/build-fallback',
    connectOptions: {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    },
  }),
  collections: [
    Pages,
    Posts,
    Projects,
    Petitions,
    PetitionSupports,
    Comments,
    Media,
    Categories,
    Donations,
    FAQ,
    Locations,
    Staff,
    Tags,
    Users,
  ],
  cors: {
    origins: [
      getServerSideURL(),
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    ].filter(Boolean),
  },
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key-for-build',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    if (shouldSkipDbAccess()) {
      console.log('[PAYLOAD INIT] ⏩ Build phase - Skipping startup database queries.')
      return
    }

    const rawUri = process.env.DATABASE_URI || ''
    const maskedUri = rawUri ? rawUri.replace(/:[^:@]+@/, ':****@') : 'MISSING (UNDEFINED)'
    console.log('\n========================================================')
    console.log('[PAYLOAD INIT] 🚀 PAYLOAD SERVER INITIALIZING')
    console.log(`[PAYLOAD INIT] 📡 DATABASE_URI: ${maskedUri}`)
    console.log('[PAYLOAD INIT] 🔍 Running database connectivity check...')

    try {
      const [pages, posts, projects, header, footer] = await Promise.all([
        payload.find({ collection: 'pages', limit: 10, overrideAccess: true }).catch((e) => ({ totalDocs: 0, error: e?.message })),
        payload.find({ collection: 'posts', limit: 10, overrideAccess: true }).catch((e) => ({ totalDocs: 0, error: e?.message })),
        payload.find({ collection: 'projects', limit: 10, overrideAccess: true }).catch((e) => ({ totalDocs: 0, error: e?.message })),
        payload.findGlobal({ slug: 'header' }).catch((e) => ({ error: e?.message })),
        payload.findGlobal({ slug: 'footer' }).catch((e) => ({ error: e?.message })),
      ])

      console.log(`[PAYLOAD INIT] 📄 Pages Collection: ${'totalDocs' in pages ? pages.totalDocs : 0} docs (Titles: ${'docs' in pages ? pages.docs?.map((d: any) => d.title).join(', ') : 'None'})`)
      console.log(`[PAYLOAD INIT] 📰 Posts Collection: ${'totalDocs' in posts ? posts.totalDocs : 0} docs`)
      console.log(`[PAYLOAD INIT] 🏗️ Projects Collection: ${'totalDocs' in projects ? projects.totalDocs : 0} docs`)
      console.log(`[PAYLOAD INIT] 🧭 Header Global: ${header && !('error' in header) ? `FOUND (${(header as any).navItems?.length || 0} nav items)` : `EMPTY/ERROR: ${header?.error || 'null'}`}`)
      console.log(`[PAYLOAD INIT] 🦶 Footer Global: ${footer && !('error' in footer) ? `FOUND (${(footer as any).footerMenus?.length || 0} menus)` : `EMPTY/ERROR: ${footer?.error || 'null'}`}`)
      console.log('========================================================\n')
    } catch (err: any) {
      console.error('[PAYLOAD INIT ERROR] ❌ Database connectivity check failed:', err?.message || err)
      console.log('========================================================\n')
    }
  },
})
