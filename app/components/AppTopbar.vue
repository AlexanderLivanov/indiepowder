<script setup lang="ts">
import { useI18n, useLocalePath, useSwitchLocalePath } from '#imports'

const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const { user } = useAuth()

const q = ref('')
const input = ref<HTMLInputElement | null>(null)

function go() {
    const v = q.value.trim()
    navigateTo(localePath(v ? `/games?q=${encodeURIComponent(v)}` : '/games'))
}

// Ctrl/Cmd + K — фокус на поиск
function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.value?.focus()
    }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <header class="tb">
        <div class="tb__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.6" y2="16.6" />
            </svg>
            <input ref="input" v-model="q" type="search" :placeholder="$t('tb.search')" @keydown.enter="go">
            <kbd>Ctrl K</kbd>
        </div>

        <div class="tb__side">
            <NuxtLink class="tb__lang" :to="switchLocalePath(locale === 'ru' ? 'en' : 'ru')">
                {{ locale === 'ru' ? 'RU' : 'EN' }}
            </NuxtLink>

            <button class="tb__ib" :aria-label="$t('nav.notifications')">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span class="tb__dot" />
            </button>

            <NuxtLink :to="localePath(user ? '/profile' : '/login')" class="tb__me">
                <span class="tb__ava" :class="{ 'is-guest': !user }">
                    {{ user ? user.nick.slice(0, 2).toUpperCase() : '?' }}
                </span>
                <span class="tb__nick">{{ user ? user.nick : $t('nav.login') }}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </NuxtLink>
        </div>
    </header>
</template>

<style scoped>
.tb {
    position: sticky;
    top: 0;
    z-index: 45;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 20px;
    padding: 12px clamp(16px, 2.5vw, 30px);
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
}

.tb__search {
    justify-self: center;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, 100%);
    min-height: 42px;
    padding: 0 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--muted);
}

.tb__search:focus-within {
    border-color: var(--p);
}

.tb__search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font: inherit;
    font-size: 14px;
}

.tb__search input::placeholder {
    color: var(--muted);
}

.tb__search kbd {
    font-family: var(--f-mono);
    font-size: 10.5px;
    padding: 3px 7px;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
}

.tb__side {
    display: flex;
    align-items: center;
    gap: 9px;
}

.tb__lang {
    display: grid;
    place-items: center;
    min-width: 40px;
    height: 38px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--text-2);
}

.tb__lang:hover {
    color: #fff;
    border-color: var(--p);
}

.tb__ib {
    position: relative;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-2);
}

.tb__ib:hover {
    color: #fff;
    border-color: var(--p);
}

.tb__dot {
    position: absolute;
    top: 8px;
    right: 9px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--p);
}

.tb__me {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 38px;
    padding: 0 12px 0 5px;
    border: 1px solid var(--border);
    border-radius: 99px;
    color: var(--text-2);
    font-size: 13.5px;
    font-weight: 600;
}

.tb__me:hover {
    color: #fff;
    border-color: var(--p);
}

.tb__ava {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-size: 11px;
}

.tb__ava.is-guest {
    background: var(--surf-2);
    color: var(--muted);
}
</style>