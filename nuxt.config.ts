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

  compatibilityDate: '2026-06-30',

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
