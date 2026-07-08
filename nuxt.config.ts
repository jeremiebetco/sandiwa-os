// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt'
  ],

  ssr: false,

  imports: {
    dirs: [
      'core/tenant',
      'core/auth',
      'core/terminology'
    ]
  },

  devtools: {
    enabled: true
  },

  app: {
    head: {
      title: 'Sandiwa OS — HOA',
      meta: [
        { name: 'description', content: 'Homeowners association operations platform' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      platformDomain: process.env.NUXT_PUBLIC_PLATFORM_DOMAIN || 'sandiwa.localhost',
      tenantRouting: process.env.NUXT_PUBLIC_TENANT_ROUTING || 'auto'
    }
  },

  compatibilityDate: '2026-06-30',

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

  vite: {
    server: {
      allowedHosts: [
        'sandiwa.localhost',
        '.sandiwa.localhost'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
