<script setup lang="ts">
import { useI18n, useLocalePath, useSwitchLocalePath } from '#imports'

const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const { user } = useAuth()
const { show: showNews, hasUnseen } = useWhatsNew()
const dusty = useDusty()
const catFailed = ref(false) // кадры котика ещё не залиты → показываем лапку

/* ── поиск: сворачивается в иконку ── */
const searchOpen = ref(false)
const q = ref('')
const input = ref<HTMLInputElement | null>(null)

async function openSearch() {
    searchOpen.value = true
    await nextTick()
    input.value?.focus()
}
function closeSearch() {
    if (!q.value) searchOpen.value = false
}
function go() {
    const v = q.value.trim()
    if (!v) return
    navigateTo({ path: localePath('/games'), query: { q: v } })
    searchOpen.value = false
    q.value = ''
}

const handleImageError = (e: Event) => {
    const img = e.target as HTMLImageElement
    img.style.display = 'none'
    // Можно также показать fallback
    // img.parentElement?.querySelector('.avatar-fallback')?.style.display = 'flex'
}

// Используем безопасный доступ с проверкой
const userName = computed(() => {
    if (!user.value) return ''
    // Проверяем, есть ли поле name в объекте
    return 'name' in user.value ? user.value.name : ''
})

const userAvatar = computed(() => {
    if (!user.value) return undefined
    return 'avatarUrl' in user.value ? user.value.avatarUrl : undefined
})

// Ctrl/Cmd+K открывает поиск
function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
    }
    if (e.key === 'Escape' && searchOpen.value) {
        q.value = ''
        searchOpen.value = false
    }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

/* ── логотип-флюгер: поворачивается к курсору ── */
const logoTilt = ref(0)
const logoEl = ref<HTMLElement | null>(null)
let raf = 0

function onLogoMove(e: MouseEvent) {
    if (raf) return
    raf = requestAnimationFrame(() => {
        raf = 0
        const el = logoEl.value
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // угол от центра значка к курсору, приглушаем до ±18°
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
        logoTilt.value = Math.max(-18, Math.min(18, angle * 0.2))
    })
}
function onLogoLeave() { logoTilt.value = 0 }
</script>

<template>
    <header class="tb" :class="{ 'is-search': searchOpen }">
        <!-- ЛЕВО: иконка поиска → раскрывается в поле -->
        <div class="tb__search" :class="{ 'is-open': searchOpen }">
            <button class="tb__searchbtn" :aria-label="$t('tb.search')" @click="openSearch">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.6" y2="16.6" />
                </svg>
            </button>
            <input ref="input" v-model="q" class="tb__input" type="search" :placeholder="$t('tb.search')"
                :tabindex="searchOpen ? 0 : -1" @keydown.enter="go" @blur="closeSearch">
            <kbd v-if="!searchOpen" class="tb__kbd">Ctrl K</kbd>
        </div>

        <!-- ЦЕНТР: логотип-флюгер (только значок, без текста) -->
        <NuxtLink :to="localePath('/')" class="tb__logo" :class="{ 'is-hidden': searchOpen }" aria-label="Dustore"
            @mousemove="onLogoMove" @mouseleave="onLogoLeave">
            <span ref="logoEl" class="tb__mark" :style="{ transform: `rotate(${logoTilt}deg)` }">
                <svg viewBox="0 0 32 32" fill="none">
                    <path d="M16 3l13 13-13 13L3 16z" fill="var(--p)" />
                    <path d="M16 9l7 7-7 7-7-7z" fill="var(--bg)" />
                    <circle cx="16" cy="16" r="2.5" fill="var(--p)" />
                </svg>
            </span>
        </NuxtLink>

        <!-- ПРАВО: статические иконки -->
        <div class="tb__side" :class="{ 'is-dim': searchOpen }">
            <button class="ib" :aria-label="$t('tb.theme')" :title="$t('tb.theme')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4.5" />
                    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
                </svg>
            </button>

            <NuxtLink class="ib ib--lang" :to="switchLocalePath(locale === 'ru' ? 'en' : 'ru')" :title="$t('tb.lang')">
                {{ locale === 'ru' ? 'RU' : 'EN' }}
            </NuxtLink>

            <!-- что нового -->
            <button class="ib" :aria-label="$t('news.button')" :title="$t('news.button')" @click="showNews">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span v-if="hasUnseen" class="ib__dot" />
            </button>

            <!-- котик-ассистент Дасти -->
            <button class="ib ib--dusty" :aria-label="$t('tb.dusty')" :title="$t('tb.dusty')" @click="dusty.show()">
                <img v-if="!catFailed" class="ib__cat" src="/dusty/dastyframe_idle.png" alt="Дасти"
                    @error="catFailed = true">
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <ellipse cx="12" cy="15" rx="5" ry="4.5" />
                    <circle cx="6.5" cy="9" r="2.1" />
                    <circle cx="10" cy="6.5" r="2.1" />
                    <circle cx="14" cy="6.5" r="2.1" />
                    <circle cx="17.5" cy="9" r="2.1" />
                </svg>
            </button>

            <!-- личные чаты -->
            <NuxtLink class="ib" :to="localePath('/chats')" :aria-label="$t('nav.ether')" :title="$t('nav.ether')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path
                        d="M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.8-.9L3 20l1.05-3.15A8.38 8.38 0 0 1 3.2 13 8.5 8.5 0 0 1 12 4.5a8.38 8.38 0 0 1 9 7z" />
                </svg>
                <span class="ib__dot" />
            </NuxtLink>
            

            <!-- профиль / вход -->
            <NuxtLink :to="localePath(user ? '/profile' : '/login')" class="tb__me">
                <span class="tb__ava" :class="{ 'is-guest': !user }">
                    <div
                        style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                        <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Аватар"
                            style="width: 100%; height: 100%; object-fit: cover; display: block;"
                            @error="handleImageError">
                        <span v-else
                            style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px; font-weight: 500; color: #fff; background: #aa148a; text-transform: uppercase;">
                            {{ user ? user.nick.slice(0, 2).toUpperCase() : '?' }}
                        </span>
                    </div>
                </span>
            </NuxtLink>
        </div>
    </header>
</template>

<style scoped>
.tb {
    position: sticky;
    top: 14px;
    z-index: 45;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 14px;
    height: 60px;
    margin: 14px clamp(16px, 2.5vw, 28px) 0;
    padding: 0 12px;
    /* островок: заметно светлее фона + свечение по краю */
    background: linear-gradient(180deg, rgba(58, 20, 74, .96), rgba(44, 12, 58, .96));
    border: 1px solid rgba(195, 33, 120, .28);
    border-radius: 18px;
    box-shadow:
        0 8px 30px -6px rgba(0, 0, 0, .55),
        0 0 0 1px rgba(255, 255, 255, .03) inset,
        0 1px 0 rgba(255, 255, 255, .06) inset;
    backdrop-filter: blur(14px) saturate(150%);
}

/* ── поиск слева ── */
.tb__search {
    justify-self: start;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 42px;
    width: 42px;
    padding: 0;
    border-radius: 12px;
    background: transparent;
    border: 1px solid transparent;
    overflow: hidden;
    transition: width .38s cubic-bezier(.22, 1, .36, 1), background .3s, border-color .3s, padding .3s;
    will-change: width;
}

.tb__search.is-open {
    width: min(60vw, 560px);
    padding: 0 6px 0 12px;
    background: var(--bg);
    border-color: var(--p);
}

.tb__searchbtn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    background: none;
    border: none;
    color: var(--text-2);
    cursor: pointer;
}

.tb__searchbtn svg {
    width: 18px;
    height: 18px;
}

.tb__searchbtn:hover {
    color: #fff;
}

.tb__search.is-open .tb__searchbtn {
    pointer-events: none;
}

.tb__input {
    flex: 1;
    min-width: 0;
    width: 100%;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font: inherit;
    font-size: 14.5px;
    opacity: 0;
    transition: opacity .25s .1s;
}

.tb__search.is-open .tb__input {
    opacity: 1;
}

.tb__input::placeholder {
    color: var(--muted);
}

.tb__kbd {
    font-family: var(--f-mono);
    font-size: 10px;
    padding: 3px 6px;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
    white-space: nowrap;
    margin-right: 4px;
}

/* ── логотип по центру ── */
.tb__logo {
    justify-self: center;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    transition: opacity .3s, transform .3s;
}

.tb__logo.is-hidden {
    opacity: 0;
    transform: scale(.6);
    pointer-events: none;
}

.tb__mark {
    display: block;
    width: 30px;
    height: 30px;
    /* поворот к курсору — плавно возвращается */
    transition: transform .35s cubic-bezier(.22, 1, .36, 1);
    will-change: transform;
    filter: drop-shadow(0 2px 8px rgba(195, 33, 120, .5));
}

.tb__mark svg {
    width: 100%;
    height: 100%;
    display: block;
}

/* ── правые иконки ── */
.tb__side {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity .3s;
}

.tb__side.is-dim {
    opacity: .35;
    pointer-events: none;
}

.ib {
    position: relative;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    background: none;
    border: none;
    border-radius: 10px;
    color: var(--text-2);
    cursor: pointer;
    transition: background .15s, color .15s;
}

.ib svg {
    width: 18px;
    height: 18px;
}

.ib:hover {
    background: rgba(255, 255, 255, .08);
    color: #fff;
}

.ib--lang {
    font-family: var(--f-mono);
    font-size: 12px;
}

.ib--dusty:hover {
    color: var(--p);
}

.ib--dusty svg {
    width: 20px;
    height: 20px;
}

.ib__cat {
    width: 26px;
    height: 26px;
    object-fit: contain;
    image-rendering: pixelated;
}

.ib__dot {
    position: absolute;
    top: 7px;
    right: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--p);
}

.tb__me {
    margin-left: 4px;
}

.tb__ava {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-size: 12px;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, .12);
}

.tb__ava.is-guest {
    background: var(--surf-2);
    color: var(--muted);
}

/* на узких экранах прячем часть иконок */
@media (max-width: 1100px) {

    .ib--lang,
    .ib--dusty {
        display: none;
    }
}
</style>