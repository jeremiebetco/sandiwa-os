export default defineNuxtPlugin({
  name: 'sandiwa-theme',
  enforce: 'post',
  setup() {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    root.style.colorScheme = 'light'
  }
})
