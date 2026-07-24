export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  devtools: { enabled: true },

  modules: ["@nuxtjs/i18n", "@vite-pwa/nuxt"],

  css: ["~/assets/css/main.css"],

  // секреты только на сервере; NUXT_SESSION_SECRET из .env перекрывает значение
  runtimeConfig: {
    sessionSecret: "",
  },

  // ── режим рендеринга по маршрутам ─────────────────────────────
  // публичные страницы отдаются с сервера (SEO), личный кабинет — обычной SPA
  routeRules: {
    "/": { prerender: true },
    "/games/**": { swr: 3600 },
    "/login": { ssr: true },
    "/console/**": { ssr: false },
    "/ether/**": { ssr: false },
  },

  i18n: {
    defaultLocale: "ru",
    langDir: "locales",
    locales: [
      { code: "ru", name: "Русский", language: "ru-RU", file: "ru.json" },
      { code: "en", name: "English", language: "en-US", file: "en.json" },
    ],
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "dustore_lang",
      redirectOn: "root",
    },
  },

  // ── PWA: устанавливается на телефон как приложение ────────────
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Dustore — инди-игры",
      short_name: "Dustore",
      description: "Играй в инди прямо в браузере. Джемы, команды, ассеты.",
      lang: "ru",
      theme_color: "#14041d",
      background_color: "#14041d",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      scope: "/",
      categories: ["games", "entertainment"],
      icons: [
        { src: "/pwa-64.png", sizes: "64x64", type: "image/png" },
        { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/pwa-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      shortcuts: [
        { name: "Каталог игр", url: "/games" },
        { name: "Джемы", url: "/jams" },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
      runtimeCaching: [
        {
          // шрифты Google кешируем надолго
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
      ],
    },
    client: { installPrompt: true },
    // манифест нужен и в dev, иначе /manifest.webmanifest даёт 404
    devOptions: { enabled: true, suppressWarnings: true },
  },

  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#14041d" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        { name: "apple-mobile-web-app-title", content: "Dustore" },
      ],
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Tiny5&family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap",
        },
      ],
    },
  },
});
