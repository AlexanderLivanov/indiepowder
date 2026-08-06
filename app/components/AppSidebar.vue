<script setup lang="ts">
import { useLocalePath } from '#imports'

const localePath = useLocalePath()
const route = useRoute()

const main = [
    { to: '/', key: 'home', icon: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z' },
    { to: '/games', key: 'catalog', icon: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z' },
    { to: '/feed', key: 'feed', icon: 'M4 6h16M4 12h16M4 18h10' },
    { to: '/apps', key: 'apps', icon: 'M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM10.5 18.5h3' },
    { to: '/foryou', key: 'foryou', icon: 'M12 3a9 9 0 1 0 9 9M12 8v4l3 2' },
    { to: '/new', key: 'new', icon: 'M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6' },
    { to: '/popular', key: 'popular', icon: 'M12 21a9 9 0 0 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
    { to: '/free', key: 'free', icon: 'M12 2l3 6 6 1-4.5 4.3 1 6.2L12 16.8 6.5 19.5l1-6.2L3 9l6-1z' },
]

const library = [
    { to: '/library', key: 'library', icon: 'M4 4h6v16H4zM14 4h6v16h-6z' },
    { to: '/library', key: 'myGames', icon: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M4 8h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z' },
    { to: '/bookmarks', key: 'bookmarks', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
    { to: '/history', key: 'history', icon: 'M3 3v6h6M3.5 13a9 9 0 1 0 2.6-6.4L3 9M12 7v5l4 2' },
]

const collections = [
    { to: '/collections', key: 'indieWeek', icon: 'M4 4h16v6H4zM4 14h16v6H4z' },
    { to: '/collections', key: 'atmospheric', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { to: '/collections', key: 'coop', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9' },
]

function isOn(to: string) {
    const p = route.path.replace(/^\/en/, '') || '/'
    return to === '/' ? p === '/' : p.startsWith(to)
}

/** «Удиви меня» — случайная игра из тех, что реже показывали */
function surprise() {
    const pool = dailyRotation(6, Date.now() % 100000)
    const g = pool[Math.floor(Math.random() * pool.length)]!
    navigateTo(localePath(`/games/${g.id}`))
}
</script>

<template>
    <aside class="sb">
        <nav class="sb__nav">
            <NuxtLink v-for="i in main" :key="i.key" :to="localePath(i.to)" class="it" :class="{ 'is-on': isOn(i.to) }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path :d="i.icon" />
                </svg>
                {{ $t(`sb.${i.key}`) }}
            </NuxtLink>

            <p class="sb__cap">{{ $t('sb.myLibrary') }}</p>
            <NuxtLink v-for="i in library" :key="i.key" :to="localePath(i.to)" class="it">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path :d="i.icon" />
                </svg>
                {{ $t(`sb.${i.key}`) }}
            </NuxtLink>

            <p class="sb__cap">{{ $t('sb.forDevs') }}</p>
            <NuxtLink :to="localePath('/devs')" class="it it--devs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                </svg>
                {{ $t('sb.devsLanding') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/console')" class="it it--devs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M4 4h16v12H4zM2 20h20M9 9l2 2-2 2M13 13h3" />
                </svg>
                {{ $t('sb.console') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/assets')" class="it it--devs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        d="M4.5 4.5H12c.83 0 1.5.67 1.5 1.5v.5m-7.5 7H2A1.5 1.5 0 0 1 .5 12V3.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1" />
                    <path fill="none" stroke="currentColor" stroke-linejoin="round" d="M12.923 11.904H7.5L10.212 7Z" />
                    <path fill="none" stroke="currentColor" stroke-linejoin="round"
                        d="M11.662 9.641a2.569 2.596 0 1 1-1.308 2.263" />
                </svg>
                {{ $t('sb.assets') }}
            </NuxtLink>

            <p class="sb__cap">{{ $t('sb.collections') }}</p>
            <NuxtLink v-for="i in collections" :key="i.key" :to="localePath(i.to)" class="it">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path :d="i.icon" />
                </svg>
                {{ $t(`sb.${i.key}`) }}
            </NuxtLink>
            <NuxtLink :to="localePath('/collections')" class="it it--add">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                {{ $t('sb.createCollection') }}
            </NuxtLink>
        </nav>

        <!-- случайная игра -->
        <div class="surp">
            <div class="surp__h">
                <span class="surp__ic">🎲</span>
                <b>{{ $t('sb.surprise') }}</b>
            </div>
            <p class="muted">{{ $t('sb.surpriseText') }}</p>
            <button class="btn btn--primary btn--sm surp__b" @click="surprise">{{ $t('sb.tryIt') }}</button>
        </div>
    </aside>
</template>

<style scoped>
.sb {
    position: sticky;
    top: 14px;
    height: calc(100dvh - 28px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 14px 0 14px 14px;
    padding: 16px 12px;
    /* островок: светлее фона, скруглён со всех сторон, со свечением */
    background: linear-gradient(180deg, rgba(52, 16, 68, .96), rgba(40, 11, 54, .96));
    border: 1px solid rgba(195, 33, 120, .22);
    border-radius: 20px;
    box-shadow:
        0 10px 34px -8px rgba(0, 0, 0, .5),
        0 1px 0 rgba(255, 255, 255, .05) inset;
    backdrop-filter: blur(14px) saturate(140%);
    overflow-y: auto;
        scrollbar-width: none;
    }
    
    .sb::-webkit-scrollbar {
        display: none;
    }

.sb__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 10px;
    font-family: var(--f-brand);
    font-size: 22px;
    letter-spacing: .5px;
}

.sb__mark {
    width: 15px;
    height: 15px;
    background: var(--p);
    transform: rotate(45deg);
    border-radius: 2px;
    transition: transform .4s;
}

.sb__brand:hover .sb__mark {
    transform: rotate(225deg);
}

.sb__nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.it {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 38px;
    padding: 0 12px;
    border-radius: 10px;
    color: var(--text-2);
    font-size: 14px;
    font-weight: 500;
    transition: background .15s, color .15s;
}

.it svg {
    width: 17px;
    height: 17px;
    flex: none;
}

.it:hover {
    background: rgba(255, 255, 255, .05);
    color: #fff;
}

.it.is-on {
    background: color-mix(in srgb, var(--p) 20%, transparent);
    color: #fff;
    font-weight: 600;
}

.it.is-on svg {
    color: var(--p);
}

.it--add {
    color: var(--muted);
}

.it--devs svg {
    color: var(--violet);
}

.it--devs:hover svg {
    color: var(--p);
}

.sb__cap {
    margin: 16px 0 6px;
    padding-left: 12px;
    font-family: var(--f-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
}

/* карточка «удиви меня» */
.surp {
    margin-top: auto;
    padding: 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.surp__h {
    display: flex;
    align-items: center;
    gap: 9px;
}

.surp__ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: color-mix(in srgb, var(--p) 22%, transparent);
    font-size: 15px;
}

.surp__h b {
    font-family: var(--f-display);
    font-size: 15px;
}

.surp p {
    margin: 9px 0 12px;
    font-size: 12px;
    line-height: 1.45;
}

.surp__b {
    width: 100%;
}
</style>