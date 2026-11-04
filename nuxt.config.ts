export default defineNuxtConfig({
  compatibilityDate: '2026-11-04',
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.scss'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru',
      },
      title: 'Заметки с задачами',
      meta: [
        {
          name: 'description',
          content: 'Заметки и списки задач в одном месте.',
        },
      ],
    },
  },
})
