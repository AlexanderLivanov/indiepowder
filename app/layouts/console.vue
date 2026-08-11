<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Каркас консоли разработчика — порт structure из devs/includes/header.php в тему Dustore. */

const route = useRoute()
const localePath = useLocalePath()
const { user } = useAuth()

// только для вошедших
watchEffect(() => {
    if (import.meta.client && !user.value) navigateTo(localePath('/login'))
})

// текущая студия для шапки сайдбара
const { data: ctx } = await useFetch<{ studio: any; studios: any[]; selected: boolean }>(
    '/api/console/context', { default: () => ({ studio: null, studios: [], selected: false }) })
const studio = computed<any>(() => ctx.value?.studio ?? null)
const studioInitials = computed(() => studio.value ? String(studio.value.name).slice(0, 2).toUpperCase() : '—')

// при входе в консоль сначала выбираем студию (если есть из чего и ещё не выбрали)
watchEffect(() => {
    if (!import.meta.client || !user.value) return
    const p = route.path.replace(/^\/en/, '')
    if (p.startsWith('/console/select')) return
    const c = ctx.value
    if (c && c.studios?.length && !c.selected) navigateTo(localePath('/console/select'))
})

// иконки Material Icons — как в старой консоли
useHead({
    link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }],
})

interface NavItem { id?: string; to?: string; icon?: string; label?: string; section?: string }
const nav: NavItem[] = [
    { id: 'dashboard', to: '/console', icon: 'dashboard', label: 'Обзор' },
    { id: 'projects', to: '/console/projects', icon: 'videogame_asset', label: 'Проекты' },
    { id: 'new', to: '/console/new', icon: 'add_circle_outline', label: 'Новый проект' },
    { id: 'events', to: '/console/events', icon: 'event', label: 'События' },
    { id: 'wishlists', to: '/console/wishlists', icon: 'favorite', label: 'Вишлисты' },
    { id: 'replies', to: '/console/replies', icon: 'reviews', label: 'Ответы на отзывы' },
    { id: 'expert', to: '/console/expert-reviews', icon: 'workspace_premium', label: 'Экспертные обзоры' },
    { id: 'analytics', to: '/console/analytics', icon: 'bar_chart', label: 'Аналитика' },
    { id: 'monetization', to: '/console/monetization', icon: 'paid', label: 'Монетизация' },
    { section: 'Студия' },
    { id: 'studio', to: '/console/mystudio', icon: 'apartment', label: 'Моя студия' },
    { id: 'staff', to: '/console/staff', icon: 'groups', label: 'Сотрудники' },
    { id: 'select', to: '/console/select', icon: 'swap_horiz', label: 'Сменить студию' },
]

const path = computed(() => route.path.replace(/^\/en/, '') || '/')
function isOn(to?: string) {
    if (!to) return false
    const p = path.value
    return to === '/console' ? p === '/console' || p === '/console/' : p.startsWith(to)
}
const pageTitle = computed(() => nav.find((i) => i.to && isOn(i.to))?.label || 'Консоль')

const initials = computed(() => (user.value?.nick || 'D').slice(0, 2).toUpperCase())
const sbOpen = ref(false)
watch(() => route.fullPath, () => { sbOpen.value = false })

useHead({ titleTemplate: () => `${pageTitle.value} — Dustore.Devs` })
</script>

<template>
    <div class="ds">
        <!-- ── сайдбар ── -->
        <aside class="ds-sb" :class="{ open: sbOpen }">
            <div class="sb-logo">
                <span class="sb-logo__ic">D</span>
                <div>
                    <div class="sb-logo__name">Dustore.Devs</div>
                    <div class="sb-logo__sub">Developer Console</div>
                </div>
            </div>

            <div class="sb-studio">
                <span class="sb-ava" :style="studio?.avatar ? { backgroundImage: `url('${studio.avatar}')` } : undefined">
                    <template v-if="!studio?.avatar">{{ studioInitials }}</template>
                </span>
                <div class="sb-studio__i">
                    <div class="sb-sname">{{ studio?.name || 'Нет студии' }}</div>
                    <div class="sb-role">{{ studio?.tiker || (user ? 'создайте студию' : 'гость') }}</div>
                </div>
            </div>

            <nav class="sb-nav">
                <template v-for="(i, idx) in nav" :key="idx">
                    <div v-if="i.section" class="sb-section">{{ i.section }}</div>
                    <NuxtLink v-else :to="localePath(i.to!)" class="nav-item" :class="{ active: isOn(i.to) }">
                        <span class="nav-ic material-icons">{{ i.icon }}</span>
                        <span class="nav-lbl">{{ i.label }}</span>
                    </NuxtLink>
                </template>
            </nav>

            <NuxtLink :to="localePath('/profile')" class="sb-user">
                <span class="sb-uava">{{ initials }}</span>
                <div class="sb-user__i">
                    <div class="sb-uname">{{ user?.nick || '—' }}</div>
                    <div class="sb-uback">← Назад в профиль</div>
                </div>
                <span class="material-icons sb-uout">logout</span>
            </NuxtLink>
        </aside>

        <div class="sb-overlay" :class="{ show: sbOpen }" @click="sbOpen = false" />

        <!-- ── основная область ── -->
        <div class="ds-main">
            <header class="ds-top">
                <div class="ds-top__l">
                    <button class="ds-burger" aria-label="Меню" @click="sbOpen = true">
                        <span class="material-icons">menu</span>
                    </button>
                    <div class="ds-title">{{ pageTitle }}</div>
                </div>
                <NuxtLink :to="localePath('/console/new')" class="btn btn--primary btn--sm ds-new">
                    <span class="material-icons">add</span> Новый проект
                </NuxtLink>
            </header>

            <main class="ds-content">
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped>
.ds { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100dvh; background: var(--bg); color: var(--text); }

/* ── сайдбар ── */
.ds-sb {
    position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(40, 11, 54, .6), rgba(20, 4, 29, .6));
    border-right: 1px solid var(--border); overflow-y: auto; scrollbar-width: none;
}
.ds-sb::-webkit-scrollbar { display: none; }
.sb-logo { display: flex; align-items: center; gap: 11px; padding: 18px 16px; border-bottom: 1px solid var(--border); }
.sb-logo__ic {
    display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px;
    background: var(--p); color: #fff; font-family: var(--f-brand); font-size: 20px;
}
.sb-logo__name { font-family: var(--f-display); font-weight: 700; font-size: 15px; }
.sb-logo__sub { font-family: var(--f-mono); font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

.sb-studio { display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.sb-ava, .sb-uava {
    display: grid; place-items: center; flex: none; border-radius: 10px; background: var(--surf-2) center / cover no-repeat;
    color: var(--text-2); font-family: var(--f-mono); font-weight: 600; overflow: hidden;
}
.sb-ava { width: 38px; height: 38px; font-size: 13px; }
.sb-studio__i { min-width: 0; }
.sb-sname { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-role { font-family: var(--f-mono); font-size: 10.5px; color: var(--muted); }

.sb-nav { flex: 1; padding: 10px 10px; display: flex; flex-direction: column; gap: 2px; }
.sb-section { margin: 14px 8px 6px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.nav-item {
    position: relative; display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 0 12px;
    border-radius: 10px; color: var(--text-2); font-size: 14px; transition: background .15s, color .15s;
}
.nav-item:hover { background: rgba(255, 255, 255, .05); color: #fff; }
.nav-item.active { background: color-mix(in srgb, var(--p) 20%, transparent); color: #fff; }
.nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 2px; background: var(--p);
}
.nav-ic { font-size: 19px; flex: none; }
.nav-item.active .nav-ic { color: var(--p); }
.nav-lbl { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sb-user { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--border); color: var(--text); }
.sb-user:hover { background: rgba(255, 255, 255, .04); }
.sb-uava { width: 34px; height: 34px; font-size: 12px; }
.sb-user__i { flex: 1; min-width: 0; }
.sb-uname { font-size: 13px; font-weight: 600; }
.sb-uback { font-family: var(--f-mono); font-size: 10.5px; color: var(--muted); }
.sb-uout { font-size: 15px; color: var(--muted); }

/* ── основная область ── */
.ds-main { display: flex; flex-direction: column; min-width: 0; }
.ds-top {
    position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between;
    gap: 12px; height: 60px; padding: 0 clamp(16px, 3vw, 28px);
    background: rgba(20, 4, 29, .85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
}
.ds-top__l { display: flex; align-items: center; gap: 12px; }
.ds-title { font-family: var(--f-display); font-weight: 700; font-size: 18px; }
.ds-burger { display: none; width: 40px; height: 40px; border: none; background: none; color: var(--text); border-radius: 10px; }
.ds-new { text-decoration: none; }
.ds-new .material-icons { font-size: 17px; }
.ds-content { flex: 1; padding: clamp(16px, 3vw, 26px); }

/* ── мобилка ── */
.sb-overlay { display: none; }
@media (max-width: 900px) {
    .ds { grid-template-columns: 1fr; }
    .ds-sb {
        position: fixed; top: 0; left: 0; z-index: 60; width: 260px;
        transform: translateX(-100%); transition: transform .28s cubic-bezier(.22, 1, .36, 1);
    }
    .ds-sb.open { transform: none; }
    .ds-burger { display: grid; place-items: center; }
    .sb-overlay { position: fixed; inset: 0; z-index: 55; background: rgba(0, 0, 0, .6); opacity: 0; pointer-events: none; transition: opacity .25s; }
    .sb-overlay.show { opacity: 1; pointer-events: auto; }
}
</style>
