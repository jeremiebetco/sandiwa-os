// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt'
  ],

  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Sandiwa OS — HOA',
      meta: [
        { name: 'description', content: 'Homeowners association operations platform' }
      ]
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

  compatibilityDate: '2026-06-30',

  imports: {
    dirs: [
      'core/tenant',
      'core/auth',
      'core/terminology'
    ]
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
