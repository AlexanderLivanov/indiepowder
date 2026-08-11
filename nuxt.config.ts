export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  devtools: { enabled: true },

  modules: ["@nuxtjs/i18n", "@vite-pwa/nuxt"],

  css: ["~/assets/css/main.css"],

  // карты кода нужны только при отладке — в проде это лишние мегабайты
  // и заметный расход памяти при сборке
  sourcemap: { server: false, client: false },

  // секреты только на сервере; NUXT_* из .env перекрывают значения.
  // напр. NUXT_YANDEX_CLIENT_SECRET → runtimeConfig.yandex.clientSecret
  runtimeConfig: {
    sessionSecret: "",
    // если задан (NUXT_OAUTH_ORIGIN=https://v3.dustore.ru) — используется как
    // origin для redirect_uri OAuth. Нужно, когда за прокси origin запроса
    // не совпадает с адресом, зарегистрированным у провайдера.
    oauthOrigin: "",
    yandex: { clientId: "", clientSecret: "" },
    vk: { clientId: "", clientSecret: "" },
    telegram: { botToken: "", botName: "" },
    // публичное (доступно и в браузере): имя бота для Telegram-виджета
    public: {
      telegramBot: "",
    },
  },

  // ── режим рендеринга по маршрутам ─────────────────────────────
  // публичные страницы отдаются с сервера (SEO), личный кабинет — обычной SPA
  // ⚠️ prerender НЕ используем: он поднимает сервер прямо во время сборки
  // и на слабой машине съедает всю память (сборка падает с «Killed»).
  // swr даёт тот же эффект — страница кешируется, но уже в рантайме.
  routeRules: {
    // ВАЖНО: у "/" НЕ ставим swr — на корне i18n пишет cookie языка
    // (detectBrowserLanguage.redirectOn: 'root'), а на закэшированном ответе
    // заголовки уже отправлены → «Cannot append headers…» и падение SSR
    // (проявлялось после OAuth-редиректа на /?welcome=1).
    "/games/**": { swr: 3600 },
    "/apps/**": { swr: 3600 },
    "/login": { ssr: true },
    "/console/**": { ssr: false },
    "/settings/**": { ssr: false },
    "/chats": { ssr: false },
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
      // Android строит splash автоматически: фон + иконка 512 + name по центру
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
      // тяжёлые фоновые медиа (картинки офиса и т.п.) НЕ precache-им — это про
      // оболочку приложения. Крупные картинки кешируем в рантайме по факту показа.
      globIgnores: ["**/office/**", "**/node_modules/**"],
      // на случай отдельного тяжёлого ассета — не роняем сборку из-за precache
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
        {
          // картинки офиса/фонов — кеш по обращению (не раздуваем precache)
          urlPattern: /\/office\/.*\.(png|webp|jpg|jpeg)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "office-bg",
            expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
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

        // iOS splash-заставки (Android читает манифест, iOS — только эти картинки)
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
          href: "/splash/splash-1179x2556.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
          href: "/splash/splash-2556x1179.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
          href: "/splash/splash-1290x2796.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
          href: "/splash/splash-2796x1290.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
          href: "/splash/splash-1170x2532.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
          href: "/splash/splash-2532x1170.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
          href: "/splash/splash-1125x2436.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
          href: "/splash/splash-2436x1125.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
          href: "/splash/splash-1242x2688.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
          href: "/splash/splash-2688x1242.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
          href: "/splash/splash-828x1792.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
          href: "/splash/splash-1792x828.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
          href: "/splash/splash-750x1334.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
          href: "/splash/splash-1334x750.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
          href: "/splash/splash-1536x2048.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
          href: "/splash/splash-2048x1536.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
          href: "/splash/splash-1668x2388.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
          href: "/splash/splash-2388x1668.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
          href: "/splash/splash-2048x2732.png",
        },
        {
          rel: "apple-touch-startup-image",
          media:
            "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
          href: "/splash/splash-2732x2048.png",
        },
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
