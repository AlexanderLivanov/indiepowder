<script setup lang="ts">
import { useLocalePath } from '#imports'

const localePath = useLocalePath()

// четыре компактные полки сверху
const cont = GAMES.slice(0, 3).map((g, i) => ({ ...g, progress: [81, 56, 12][i]! }))
const forYou = hiddenGems(3)
const fresh = freshGames(3)
const free = webFree(3)

// основная сетка
const page = ref(1)
const PER = 8
const sort = ref<'pop' | 'new' | 'rating' | 'cheap'>('pop')

const sorted = computed(() => {
    const a = [...GAMES]
    if (sort.value === 'new') a.sort((x, y) => y.date - x.date)
    else if (sort.value === 'rating') a.sort((x, y) => y.rating - x.rating)
    else if (sort.value === 'cheap') a.sort((x, y) => x.price - y.price)
    else a.sort((x, y) => y.plays - x.plays)
    return a
})
const pages = computed(() => Math.ceil(sorted.value.length / PER))
const shown = computed(() => sorted.value.slice((page.value - 1) * PER, page.value * PER))

useSeoMeta({
    title: 'Dustore — Ассеты для ваших проектов',
    description: 'Каталог ассетов',
})
</script>

<template>
    <div class="home">
       
        <!-- фильтры -->
        <div class="bar">
            <div class="bar__f">
                <button v-for="f in ['genre', 'platform', 'price', 'kind']" :key="f" class="fbtn">
                    {{ $t(`filters.${f}`) }}
                    <svg width="9" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>
            </div>

            <label class="bar__s">
                <span class="muted">{{ $t('filters.sort') }}:</span>
                <select v-model="sort">
                    <option value="pop">{{ $t('catalog.sortPop') }}</option>
                    <option value="new">{{ $t('catalog.sortNew') }}</option>
                    <option value="rating">{{ $t('catalog.sortRating') }}</option>
                    <option value="cheap">{{ $t('catalog.sortCheap') }}</option>
                </select>
            </label>
        </div>

        <!-- сетка -->
        <div class="grid">
            <GameCard v-for="g in shown" :key="g.id" :game="g" />
        </div>

        <!-- страницы -->
        <nav class="pg">
            <button :disabled="page === 1" @click="page--">‹</button>
            <button v-for="p in pages" :key="p" :class="{ 'is-on': p === page }" @click="page = p">{{ p }}</button>
            <button :disabled="page === pages" @click="page++">›</button>
        </nav>
    </div>
</template>

<style scoped>
.home {
    padding: clamp(14px, 2vw, 22px) clamp(16px, 2.5vw, 30px) 40px;
    display: flex;
    flex-direction: column;
    gap: clamp(20px, 3vw, 30px);
}

/* полки */
.rails {
    display: grid;
    grid-template-columns: 1fr;
    gap: 22px;
}

@media (min-width: 700px) {
    .rails {
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 1280px) {
    .rails {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* панель фильтров */
.bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.bar__f {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.fbtn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 40px;
    padding: 0 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-2);
    font-size: 13.5px;
}

.fbtn:hover {
    border-color: var(--p);
    color: #fff;
}

.bar__s {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

.bar__s select {
    min-height: 40px;
    padding: 0 10px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font: inherit;
    font-size: 13.5px;
}

/* сетка карточек */
.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

@media (min-width: 700px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 18px;
    }
}

@media (min-width: 1100px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1400px) {
    .grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* пагинация */
.pg {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
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
</style>