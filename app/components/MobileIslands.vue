<script setup lang="ts">
import { useLocalePath } from '#imports'

const localePath = useLocalePath()
const route = useRoute()
const { user, logout } = useAuth()

/* ── название текущего раздела для верхнего островка ── */
const sectionKey = computed(() => {
    const p = route.path.replace(/^\/en/, '') || '/'
    if (p === '/') return 'home'
    const first = p.split('/')[1]
    return first || 'home'
})
const sectionLabel = computed(() => {
    const map: Record<string, string> = {
        home: 'tabs.home', games: 'nav.games', feed: 'nav.feed', assets: 'nav.assets', jams: 'nav.jams',
        crews: 'nav.crews', devlogs: 'nav.devlogs', bugs: 'nav.bugs', console: 'nav.console',
        chats: 'nav.ether', profile: 'tabs.profile', login: 'nav.login',
    }
    return map[sectionKey.value] || 'tabs.home'
})

/* ── меню ── */
const menuOpen = ref(false)

const menu = [
    { to: '/', label: 'tabs.home', icon: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z' },
    { to: '/games', label: 'nav.games', icon: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M4 8h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z' },
    { to: '/feed', label: 'nav.feed', icon: 'M4 6h16M4 12h16M4 18h10' },
    { to: '/chats', label: 'nav.ether', icon: 'M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.8-.9L3 20l1.05-3.15A8.38 8.38 0 0 1 3.2 13 8.5 8.5 0 0 1 12 4.5a8.38 8.38 0 0 1 9 7z' },
    { to: '/assets', label: 'nav.assets', icon: 'M12 2l9 5v10l-9 5-9-5V7z' },
    { to: '/jams', label: 'nav.jams', icon: 'M12 2v6M12 2a5 5 0 0 1 5 5c0 4-5 9-5 9S7 11 7 7a5 5 0 0 1 5-5zM5 21h14' },
    { to: '/crews', label: 'nav.crews', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { to: '/devlogs', label: 'nav.devlogs', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    { to: '/bugs', label: 'nav.bugs', icon: 'M8 2l1.5 2h5L16 2M4 13h16M12 20v-8M6 8h12v7a6 6 0 0 1-12 0z' },
]

/* ── профиль: закрыт → приоткрыт → развёрнут ── */
type Snap = 'closed' | 'partial' | 'full'
const snap = ref<Snap>('closed')
const drag = ref(0)
const dragging = ref(false)

let startY = 0
let startSnap: Snap = 'closed'

function onStart(e: TouchEvent | MouseEvent) {
    startY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
    startSnap = snap.value
    dragging.value = true
    drag.value = 0
}

function onMove(e: TouchEvent | MouseEvent) {
    if (!dragging.value) return
    const y = 'touches' in e ? e.touches[0]!.clientY : e.clientY
    drag.value = y - startY   // вверх < 0, вниз > 0
}

function onEnd() {
    if (!dragging.value) return
    dragging.value = false
    const d = drag.value
    drag.value = 0

    if (startSnap === 'partial') {
        if (d < -50) snap.value = 'full'        // потянул вверх — раскрыть
        else if (d > 70) snap.value = 'closed'  // потянул вниз — закрыть
    } else if (startSnap === 'full') {
        if (d > 130) snap.value = 'closed'      // сильно вниз — закрыть
        else if (d > 50) snap.value = 'partial' // немного вниз — свернуть
    }
}

function tapIsland() {
    menuOpen.value = false
    snap.value = snap.value === 'closed' ? 'partial' : 'closed'
}

// закрываем всё при переходе на другую страницу
watch(() => route.fullPath, () => { menuOpen.value = false; snap.value = 'closed' })

// блокируем прокрутку фона, пока что-то открыто
watchEffect(() => {
    if (!import.meta.client) return
    const lock = menuOpen.value || snap.value !== 'closed'
    document.body.style.overflow = lock ? 'hidden' : ''
})
onUnmounted(() => { if (import.meta.client) document.body.style.overflow = '' })

// базовое смещение состояния: full = 0 (виден весь лист),
// partial = сдвинут вниз так, что торчит только верхняя часть.
const PARTIAL_OFFSET = 320   // на сколько px опущен лист в «приоткрытом» виде

const sheetStyle = computed(() => {
    const base = snap.value === 'full' ? 0 : PARTIAL_OFFSET
    let y = base + drag.value
    if (y < 0) y = y * 0.25          // за верхнюю границу — резинка
    return {
        transform: `translateY(${y}px)`,
        transition: dragging.value ? 'none' : 'transform .34s cubic-bezier(.2,.8,.2,1)',
    }
})
</script>

<template>
    <div class="isl">
        <!-- ══════ ВЕРХНИЙ ОСТРОВОК ══════ -->
        <div class="top">
            <button class="top__pill" @click="menuOpen = !menuOpen; snap = 'closed'">
                <span class="top__mark" />
                <span class="top__brand">dustore</span>
                <span class="top__sep" />
                <span class="top__sec">{{ $t(sectionLabel) }}</span>
                <svg class="top__arw" :class="{ 'is-open': menuOpen }" width="10" height="6" viewBox="0 0 10 6"
                    fill="none">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
        </div>

        <!-- ══════ НИЖНИЙ ОСТРОВОК ══════ -->
        <div class="bot" :class="{ 'is-hidden': snap !== 'closed' }">
            <button class="bot__pill" @click="tapIsland">
                <span class="bot__ava" :class="{ 'is-guest': !user }">
                    {{ user ? user.nick.slice(0, 2).toUpperCase() : '?' }}
                </span>
                <span class="bot__info">
                    <span class="bot__nick">
                        {{ user ? user.nick : $t('islands.guest') }}
                        <span v-if="user?.verified" class="vfd">✓</span>
                        <span v-else-if="user" class="badge">{{ user.role }}</span>
                    </span>
                    <span class="bot__status">
                        <span class="bot__dot" :class="{ 'is-off': !user }" />
                        {{ user ? $t('islands.online') : $t('islands.signInHint') }}
                    </span>
                </span>
                <span class="bot__chev">⌃</span>
            </button>
        </div>

        <!-- ══════ МЕНЮ СНИЗУ ══════ -->
        <Teleport to="body">
            <Transition name="sh">
                <div v-if="menuOpen" class="ov" @click.self="menuOpen = false">
                    <div class="sheet sheet--menu">
                        <span class="grip" />
                        <nav class="mlist">
                            <NuxtLink v-for="m in menu" :key="m.to" :to="localePath(m.to)" class="mitem">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path :d="m.icon" />
                                </svg>
                                {{ $t(m.label) }}
                            </NuxtLink>
                        </nav>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- ══════ ПРОФИЛЬ ══════ -->
        <Teleport to="body">
            <Transition name="sh">
                <div v-if="snap !== 'closed'" class="ov" @click.self="snap = 'closed'">
                    <div class="sheet sheet--profile" :class="`is-${snap}`" :style="sheetStyle"
                        @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd" @mousedown="onStart"
                        @mousemove="onMove" @mouseup="onEnd" @mouseleave="onEnd">
                        <span class="grip" />

                        <!-- шапка профиля -->
                        <header class="ph">
                            <span class="ph__ava" :class="{ 'is-guest': !user }">
                                {{ user ? user.nick.slice(0, 2).toUpperCase() : '?' }}
                            </span>
                            <div class="ph__i">
                                <b>{{ user ? user.nick : $t('islands.guest') }}<span v-if="user?.verified"
                                        class="vfd">✓</span></b>
                                <span class="muted">{{ user ? user.email : $t('islands.signInHint') }}</span>
                            </div>
                            <button class="ph__x" :aria-label="$t('nav.close')" @click.stop="snap = 'closed'">✕</button>
                        </header>

                        <!-- гость -->
                        <template v-if="!user">
                            <p class="muted pg">{{ $t('islands.guestText') }}</p>
                            <NuxtLink :to="localePath('/login')" class="btn btn--primary pw">{{ $t('nav.login') }}
                            </NuxtLink>
                        </template>

                        <!-- вошёл -->
                        <template v-else>
                            <dl class="pstats">
                                <div>
                                    <dt>{{ user.votesUp }}</dt>
                                    <dd>{{ $t('islands.votes') }}</dd>
                                </div>
                                <div>
                                    <dt>{{ user.profileViews }}</dt>
                                    <dd>{{ $t('islands.views') }}</dd>
                                </div>
                                <div>
                                    <dt>{{ user.role }}</dt>
                                    <dd>{{ $t('islands.role') }}</dd>
                                </div>
                            </dl>

                            <p class="hint muted">{{ snap === 'partial' ? $t('islands.pullUp') : $t('islands.pullDown')
                                }}</p>

                            <!-- видно только в развёрнутом виде -->
                            <div class="pfull">
                                <NuxtLink :to="localePath('/profile')" class="prow">
                                    <span class="prow__ic">◐</span>{{ $t('islands.myProfile') }}<span
                                        class="prow__a">→</span>
                                </NuxtLink>
                                <NuxtLink :to="localePath('/profile')" class="prow">
                                    <span class="prow__ic">▦</span>{{ $t('islands.collection') }}<span
                                        class="prow__a">→</span>
                                </NuxtLink>
                                <NuxtLink :to="localePath('/chats')" class="prow">
                                    <span class="prow__ic">◇</span>{{ $t('nav.ether') }}<span class="prow__a">→</span>
                                </NuxtLink>
                                <NuxtLink :to="localePath('/console')" class="prow">
                                    <span class="prow__ic">⚙</span>{{ $t('nav.console') }}<span class="prow__a">→</span>
                                </NuxtLink>
                                <button class="prow prow--out" @click="logout()">
                                    <span class="prow__ic">⏻</span>{{ $t('islands.logout') }}
                                </button>
                            </div>
                        </template>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.isl {
    display: block;
}

/* ══════ верхний островок ══════ */
.top {
    position: fixed;
    top: calc(10px + env(safe-area-inset-top));
    left: 0;
    right: 0;
    z-index: 55;
    display: flex;
    justify-content: center;
    pointer-events: none;
}

.top__pill {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: calc(100vw - 28px);
    padding: 8px 15px;
    border: 1px solid rgba(195, 33, 120, .3);
    border-radius: 99px;
    background: linear-gradient(180deg, rgba(58, 20, 74, .95), rgba(44, 12, 58, .95));
    backdrop-filter: blur(16px) saturate(160%);
    box-shadow: 0 8px 26px rgba(0, 0, 0, .5), 0 1px 0 rgba(255, 255, 255, .06) inset;
    color: var(--text);
    transition: transform .15s;
    -webkit-tap-highlight-color: transparent;
}

.top__pill:active {
    transform: scale(.97);
}

.top__mark {
    width: 9px;
    height: 9px;
    background: var(--p);
    transform: rotate(45deg);
    flex: none;
}

.top__brand {
    font-family: var(--f-brand);
    font-size: 15px;
}

.top__sep {
    width: 1px;
    height: 13px;
    background: var(--border);
}

.top__sec {
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.top__arw {
    color: var(--muted);
    transition: transform .25s;
    flex: none;
}

.top__arw.is-open {
    transform: rotate(180deg);
}

/* ══════ нижний островок ══════ */
.bot {
    position: fixed;
    bottom: calc(16px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 24px);
    max-width: 380px;
    z-index: 55;
    transition: opacity .25s, transform .25s;
}

.bot.is-hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(14px);
    pointer-events: none;
}

.bot__pill {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 7px 14px 7px 7px;
    border: 1px solid rgba(195, 33, 120, .32);
    border-radius: 60px;
    background: linear-gradient(180deg, rgba(60, 20, 78, .96), rgba(46, 13, 60, .96));
    backdrop-filter: blur(16px) saturate(170%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, .55), 0 1px 0 rgba(255, 255, 255, .07) inset;
    color: var(--text);
    text-align: left;
    transition: transform .15s;
    -webkit-tap-highlight-color: transparent;
}

.bot__pill:active {
    transform: scale(.975);
}

.bot__ava {
    flex: none;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(195, 33, 120, .4);
}

.bot__ava.is-guest {
    background: var(--surf-2);
    color: var(--muted);
    box-shadow: none;
}

.bot__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.bot__nick {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 14.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bot__status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bot__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2ecc71;
    flex: none;
}

.bot__dot.is-off {
    background: var(--muted);
}

.bot__chev {
    color: var(--muted);
    font-size: 15px;
    flex: none;
}

.vfd {
    display: inline-grid;
    place-items: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-size: 9px;
    flex: none;
}

.badge {
    padding: 1px 8px;
    border-radius: 99px;
    background: rgba(195, 33, 120, .2);
    color: #f0a8cd;
    font-family: var(--f-mono);
    font-size: 9px;
    text-transform: uppercase;
}

/* ══════ шторки ══════ */
.ov {
    position: fixed;
    inset: 0;
    z-index: 120;
    background: rgba(0, 0, 0, .6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
}

.sheet {
    width: 100%;
    background: var(--surf-2);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 26px 26px 0 0;
    padding: 10px 16px calc(22px + env(safe-area-inset-bottom));
    box-shadow: 0 -18px 50px rgba(0, 0, 0, .6);
    overflow: hidden;
}

.grip {
    display: block;
    width: 42px;
    height: 4px;
    margin: 0 auto 14px;
    border-radius: 2px;
    background: var(--border);
}

/* меню */
.sheet--menu {
    max-height: 78dvh;
    overflow-y: auto;
}

.mlist {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mitem {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 14px 12px;
    border-radius: 12px;
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
}

.mitem svg {
    width: 20px;
    height: 20px;
    color: var(--p);
    flex: none;
}

.mitem:active {
    background: rgba(195, 33, 120, .18);
}

/* профиль: два размера */
/* лист всегда полной высоты — состояния сдвигают его через translateY,
   поэтому кнопки снизу отрисованы заранее и «разрыва» при перетаскивании нет */
.sheet--profile {
    height: 92dvh;
    max-height: 92dvh;
    touch-action: none;
    display: flex;
    flex-direction: column;
    /* запас снизу, чтобы кнопки не упирались в край телефона */
    padding-bottom: calc(40px + env(safe-area-inset-bottom));
}

/* в развёрнутом виде внутренность можно листать */
.sheet--profile.is-full {
    overflow-y: auto;
}

.sheet--profile.is-partial {
    overflow: hidden;
}

.ph {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ph__ava {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-weight: 600;
    font-size: 17px;
}

.ph__ava.is-guest {
    background: var(--surf);
    color: var(--muted);
}

.ph__i {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.ph__i b {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--f-display);
    font-size: 17px;
}

.ph__i span {
    font-size: 12.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ph__x {
    width: 34px;
    height: 34px;
    flex: none;
    background: none;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--muted);
}

.pg {
    margin: 16px 0 14px;
    font-size: 13.5px;
}

.pw {
    width: 100%;
}

.pstats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 18px 0 0;
}

.pstats>div {
    padding: 11px 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
    text-align: center;
}

.pstats dt {
    font-family: var(--f-mono);
    font-size: 19px;
    font-weight: 600;
    color: var(--p);
}

.pstats dd {
    margin: 3px 0 0;
    font-size: 10.5px;
    color: var(--text-2);
}

.hint {
    margin: 14px 0 0;
    text-align: center;
    font-family: var(--f-mono);
    font-size: 10.5px;
}

/* строки меню профиля видны всегда — просто в «приоткрытом» виде
   они уезжают ниже экрана вместе с листом */
.pfull {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 16px;
}

.prow {
    display: flex;
    align-items: center;
    gap: 13px;
    width: 100%;
    padding: 14px 12px;
    background: none;
    border: none;
    border-radius: 12px;
    color: var(--text);
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 15.5px;
    text-align: left;
}

.prow:active {
    background: rgba(195, 33, 120, .18);
}

.prow__ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 9px;
    background: var(--bg);
    color: var(--p);
    font-size: 14px;
}

.prow__a {
    margin-left: auto;
    color: var(--muted);
}

.prow--out {
    color: #ff9b9c;
}

.prow--out .prow__ic {
    color: #ff9b9c;
}

.sh-enter-active,
.sh-leave-active {
    transition: opacity .28s;
}

.sh-enter-active .sheet,
.sh-leave-active .sheet {
    transition: transform .32s cubic-bezier(.2, .8, .2, 1);
}

.sh-enter-from,
.sh-leave-to {
    opacity: 0;
}

.sh-enter-from .sheet,
.sh-leave-to .sheet {
    transform: translateY(100%);
}

/* на десктопе островков нет — там обычная шапка */
@media (min-width: 900px) {
    .isl {
        display: none;
    }
}
</style>
