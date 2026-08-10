/**
 * Директива v-lazybg: ставит CSS-фон элемента только когда он приближается
 * к вьюпорту (IntersectionObserver). Ускоряет первую отрисовку каталога —
 * картинки офф-скрин игр не грузятся, пока до них не долистали.
 *
 * Использование: <div v-lazybg="'url(...) center/cover'" />
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        const bg = el.dataset.lazybg
        if (bg) el.style.background = bg
        io.unobserve(el)
      }
    },
    { rootMargin: "300px" },
  )

  nuxtApp.vueApp.directive("lazybg", {
    mounted(el: HTMLElement, binding) {
      el.dataset.lazybg = String(binding.value ?? "")
      io.observe(el)
    },
    updated(el: HTMLElement, binding) {
      const v = String(binding.value ?? "")
      if (el.dataset.lazybg !== v) {
        el.dataset.lazybg = v
        el.style.background = ""
        io.observe(el)
      }
    },
    unmounted(el: HTMLElement) {
      io.unobserve(el)
    },
  })
})
