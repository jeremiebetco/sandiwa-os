// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],

  ssr: false,

  imports: {
    dirs: [
      'core/tenant',
      'core/auth',
      'core/terminology',
      'composables'
    ]
  },

  devtools: {
    enabled: true
  },

  app: {
    head: {
      title: 'Sandiwa OS — HOA',
      meta: [
        { name: 'description', content: 'Homeowners association operations platform' },
        { property: 'og:title', content: 'Sandiwa OS — HOA' },
        { property: 'og:description', content: 'Homeowners association operations platform' },
        { property: 'og:image', content: '/assets/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: '/assets/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/assets/favicon.png' },
        { rel: 'apple-touch-icon', href: '/assets/sandiwa-mark.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    // Sandiwa brand packs are light-only; dark mode caused unreadable form controls.
    colorMode: false
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    public: {
      platformDomain: process.env.NUXT_PUBLIC_PLATFORM_DOMAIN || 'sandiwa.localhost',
      tenantRouting: process.env.NUXT_PUBLIC_TENANT_ROUTING || 'auto'
    }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    // Ensure server has DATABASE_URL at runtime
    runtimeConfig: {
      databaseUrl: process.env.DATABASE_URL || ''
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Cross-Origin-Opener-Policy': 'same-origin',
          // Production only: Vite HMR needs eval in dev. SPA needs 'unsafe-inline' for
          // Nuxt's window.__NUXT__ bootstrap (no nonce on static hosts).
          ...(process.env.NODE_ENV === 'production'
            ? {
                'Content-Security-Policy': [
                  'default-src \'self\'',
                  'script-src \'self\' \'unsafe-inline\'',
                  'style-src \'self\' \'unsafe-inline\'',
                  'img-src \'self\' data: blob:',
                  'font-src \'self\' data:',
                  'connect-src \'self\'',
                  'frame-ancestors \'none\'',
                  'base-uri \'self\'',
                  'form-action \'self\'',
                  'object-src \'none\''
                ].join('; ')
              }
            : {})
        }
      }
    }
  },

  vite: {
    server: {
      allowedHosts: [
        'sandiwa.localhost',
        'localhost',
        '127.0.0.1',
        '.sandiwa.localhost'
      ]
    }
  },

  hooks: {
    'pages:extend'(pages) {
      const tenantPages = pages
        .filter((page) => {
          const path = page.path ?? ''
          return !path.startsWith('/platform') && !path.startsWith('/o/')
        })
        .map(page => ({
          ...page,
          path: `/o/:tenantSlug${page.path === '/' ? '' : page.path}`,
          name: page.name ? `tenant-${String(page.name)}` : undefined
        }))

      pages.push(...tenantPages)
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'tl', name: 'Tagalog', file: 'tl.json' }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    vueI18n: 'i18n.config.ts'
  }
})
