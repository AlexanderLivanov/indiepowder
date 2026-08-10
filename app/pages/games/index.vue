<script setup lang="ts">
import { useI18n } from '#imports'

const { t } = useI18n()

// реальные игры из БД (если есть) — иначе демо
const real = await useRealGames()
const source = computed(() => real.value.length ? real.value : GAMES)
const allTags = computed(() => [...new Set(source.value.flatMap((g) => g.tags))].sort())

// основной режим — «Все игры»; подборки пока отключены
const view = ref<'picks' | 'all'>('all')

// зерно дня считаем на сервере и передаём в браузер —
// иначе при смене суток/часового пояса сервер и клиент дадут разный порядок
const daySeed = useState('daySeed', () =>
    Number(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
)

const rails = computed(() => [
    { key: 'picks', games: editorPicks(), accent: 'var(--warn)' },
    { key: 'fresh', games: freshGames(), accent: 'var(--ok)' },
    { key: 'gems', games: hiddenGems(), accent: 'var(--p)' },
    { key: 'jam', games: jamWinners(), accent: 'var(--violet)' },
    { key: 'roulette', games: dailyRotation(8, daySeed.value), accent: '#2AABEE' },
    { key: 'web', games: webFree(), accent: 'var(--ok)' },
    { key: 'popular', games: popularGames(), accent: 'var(--text-2)' },
].filter(r => r.games.length))

// ── каталог со всеми играми ──
const query = ref('')
const activeTag = ref('all')
const sort = ref<'pop' | 'new' | 'cheap' | 'rating'>('pop')
const filtersOpen = ref(false)

const sorts = [
    { key: 'pop', label: 'catalog.sortPop' },
    { key: 'new', label: 'catalog.sortNew' },
    { key: 'rating', label: 'catalog.sortRating' },
    { key: 'cheap', label: 'catalog.sortCheap' },
] as const

const list = computed(() => {
    const q = query.value.trim().toLowerCase()
    const filtered = source.value.filter((g) => {
        const byT = activeTag.value === 'all' || g.tags.includes(activeTag.value)
        const byQ = !q || g.title.toLowerCase().includes(q) || g.author.includes(q)
        return byT && byQ
    })
    const sorted = [...filtered]
    if (sort.value === 'new') sorted.sort((a, b) => b.date - a.date)
    else if (sort.value === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    else if (sort.value === 'cheap') sorted.sort((a, b) => a.price - b.price)
    else sorted.sort((a, b) => b.plays - a.plays)
    return sorted
})

// пагинация «всех игр»
const page = ref(1)
const PER = 24
const pageCount = computed(() => Math.max(1, Math.ceil(list.value.length / PER)))
const paged = computed(() => list.value.slice((page.value - 1) * PER, page.value * PER))
watch([query, activeTag, sort], () => { page.value = 1 })

function reset() { query.value = ''; activeTag.value = 'all' }

useSeoMeta({
    title: 'Каталог игр — Dustore',
    description: 'Все игры платформы: выбор редакции, новинки, победители джемов и недооценённые находки.',
})
</script>

<template>
    <div class="wrap games">
        <header class="games__head">
            <div>
                <h1>{{ $t('catalog.title') }}</h1>
                <p class="muted">{{ $t('catalog.subtitle') }}</p>
            </div>
            <div class="switch">
                <button :class="{ 'is-on': view === 'all' }" @click="view = 'all'">{{ $t('catalog.viewAll', {
                    n:
                    source.length }) }}</button>
                <button class="is-disabled" disabled title="Подборки появятся позже">{{ $t('catalog.viewPicks') }} ·
                    скоро</button>
            </div>
        </header>

        <!-- ============ ПОДБОРКИ ============ -->
        <template v-if="view === 'picks'">
            <GameRail v-for="r in rails" :key="r.key" :title="$t(`rail.${r.key}`)" :sub="$t(`rail.${r.key}_d`)"
                :games="r.games" :accent="r.accent" />

            <!-- ниши: в своём теге почти каждая игра попадает в тройку -->
            <section class="niches">
                <h2>{{ $t('rail.byTag') }}</h2>
                <p class="muted niches__sub">{{ $t('rail.byTag_d') }}</p>
                <div class="niches__list">
                    <button v-for="tg in GAME_TAGS" :key="tg" class="tagbtn"
                        @click="view = 'all'; activeTag = tg; filtersOpen = true">{{ tg }} <span class="muted">{{
                            byTag(tg).length }}</span></button>
                </div>
            </section>
        </template>

        <!-- ============ ВЕСЬ КАТАЛОГ ============ -->
        <template v-else>
            <div class="bar">
                <div class="search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.6" y2="16.6" />
                    </svg>
                    <input v-model="query" type="search" :placeholder="$t('catalog.search')">
                </div>

                <button class="filters-toggle" @click="filtersOpen = !filtersOpen">
                    {{ $t('catalog.filters') }}
                    <span v-if="activeTag !== 'all'" class="badge">1</span>
                </button>

                <div class="sorts">
                    <button v-for="s in sorts" :key="s.key" class="sort" :class="{ 'is-on': sort === s.key }"
                        @click="sort = s.key">
                        {{ $t(s.label) }}
                    </button>
                </div>
            </div>

            <div class="tags" :class="{ 'is-open': filtersOpen }">
                <button class="tagbtn" :class="{ 'is-on': activeTag === 'all' }" @click="activeTag = 'all'">{{
                    $t('catalog.all') }}</button>
                <button v-for="tg in allTags" :key="tg" class="tagbtn" :class="{ 'is-on': activeTag === tg }"
                    @click="activeTag = tg">{{ tg }}</button>
            </div>

            <p class="count">{{ $t('catalog.found', { n: list.length }) }}</p>

            <div v-if="list.length" class="grid">
                <GameCard v-for="g in paged" :key="g.id" :game="g" />
            </div>
            <div v-else class="empty card">
                <p>{{ $t('catalog.empty') }}</p>
                <button class="btn btn--sm" @click="reset">{{ $t('catalog.reset') }}</button>
            </div>

            <nav v-if="pageCount > 1" class="pg">
                <button :disabled="page === 1" @click="page--">‹</button>
                <button v-for="p in pageCount" :key="p" :class="{ 'is-on': p === page }" @click="page = p">{{ p
                    }}</button>
                <button :disabled="page === pageCount" @click="page++">›</button>
            </nav>
        </template>
    </div>
</template>

<style scoped>
.games {
    padding-top: clamp(20px, 5vw, 36px);
}

.games__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
}

.games__head h1 {
    font-size: clamp(24px, 6vw, 34px);
}

.games__head p {
    margin: 8px 0 0;
    font-size: 14px;
}

.switch {
    display: flex;
    gap: 3px;
    padding: 3px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.switch button {
    min-height: 36px;
    padding: 0 14px;
    background: none;
    border: none;
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 12px;
}

.switch button.is-on {
    background: var(--p);
    color: #fff;
}

/* ---- ниши ---- */
.niches {
    margin-top: clamp(34px, 6vw, 52px);
}

.niches h2 {
    font-size: clamp(17px, 4.4vw, 23px);
}

.niches__sub {
    margin: 6px 0 14px;
    font-size: 12.5px;
    max-width: 540px;
}

.niches__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tagbtn {
    min-height: 38px;
    padding: 0 15px;
    background: rgba(255, 255, 255, .05);
    border: none;
    border-radius: 9px;
    color: #fff;
    font-weight: 300;
    font-size: 14px;
    transition: background .15s;
}

.tagbtn:hover {
    background: #ffffff40;
}

.tagbtn.is-on {
    background: var(--p);
}

.tagbtn span {
    font-family: var(--f-mono);
    font-size: 11px;
    margin-left: 4px;
}

/* ---- каталог ---- */
.bar {
    display: flex;
    gap: 10px;
    margin: 22px 0 14px;
    flex-wrap: wrap;
}

.search {
    flex: 1 1 220px;
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: var(--tap);
    padding: 0 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--muted);
}

.search:focus-within {
    border-color: var(--p);
}

.search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font: inherit;
}

.search input::placeholder {
    color: var(--muted);
}

.filters-toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: var(--tap);
    padding: 0 16px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--text-2);
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 14px;
}

.badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-size: 10px;
    display: grid;
    place-items: center;
}

.sorts {
    display: none;
    gap: 6px;
}

.sort {
    min-height: var(--tap);
    padding: 0 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 12px;
}

.sort.is-on {
    background: var(--p);
    border-color: var(--p);
    color: #fff;
}

.tags {
    display: none;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 16px;
}

.tags.is-open {
    display: flex;
}

.count {
    margin: 0 0 12px;
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--muted);
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.empty {
    padding: 50px 20px;
    text-align: center;
}

.empty p {
    margin: 0 0 16px;
    color: var(--text-2);
}

.switch button.is-disabled {
    opacity: .4;
    cursor: not-allowed;
}

.pg {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 24px;
}

.pg button {
    min-width: 38px;
    height: 38px;
    padding: 0 10px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 13px;
}

.pg button:hover:not(:disabled) {
    border-color: var(--p);
    color: #fff;
}

.pg button.is-on {
    background: var(--p);
    border-color: var(--p);
    color: #fff;
}

.pg button:disabled {
    opacity: .35;
    cursor: not-allowed;
}

@media (min-width: 720px) {
    .filters-toggle {
        display: none;
    }

    .sorts {
        display: flex;
    }

    .tags {
        display: flex;
    }

    .grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 18px;
    }
}
</style>