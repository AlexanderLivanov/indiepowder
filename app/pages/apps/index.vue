<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Каталог мобильных игр и приложений. На ПК — сетка квадратных иконок. */

const localePath = useLocalePath()
const query = ref('')
const activeCat = ref('all')
const kind = ref<'all' | 'games' | 'apps'>('all')

const cats = computed(() => ['all', ...APP_CATEGORIES])

const list = computed(() => {
    const q = query.value.trim().toLowerCase()
    return APPS.filter((a) => {
        const byKind = kind.value === 'all' || (kind.value === 'games' ? a.isGame : !a.isGame)
        const byCat = activeCat.value === 'all' || a.category === activeCat.value
        const byQ = !q || a.name.toLowerCase().includes(q) || a.developer.includes(q) || a.category.toLowerCase().includes(q)
        return byKind && byCat && byQ
    })
})

const featured = computed(() => featuredApps())
const top = computed(() => topApps(6))

function reset() { query.value = ''; activeCat.value = 'all'; kind.value = 'all' }

useSeoMeta({
    title: 'Мобильные игры и приложения — Dustore',
    description: 'Каталог мобильных инди-игр и приложений: выбор редакции, топ загрузок, категории.',
})
</script>

<template>
    <div class="wrap apps">
        <header class="apps__head">
            <div>
                <h1>Мобильные</h1>
                <p class="muted">Инди-игры и приложения для телефона</p>
            </div>
            <div class="switch">
                <button :class="{ 'is-on': kind === 'all' }" @click="kind = 'all'">Всё</button>
                <button :class="{ 'is-on': kind === 'games' }" @click="kind = 'games'">Игры</button>
                <button :class="{ 'is-on': kind === 'apps' }" @click="kind = 'apps'">Приложения</button>
            </div>
        </header>

        <!-- витрина «выбор редакции» -->
        <section v-if="featured.length" class="feature">
            <NuxtLink v-for="a in featured" :key="a.id" :to="localePath(`/apps/${a.id}`)" class="fcard">
                <div class="fcard__bg" :style="{ background: a.icon }" />
                <div class="fcard__row">
                    <div class="fcard__icon" :style="{ background: a.icon }">
                        <span>{{ a.glyph }}</span>
                    </div>
                    <div class="fcard__info">
                        <span class="fcard__eyebrow">Выбор редакции</span>
                        <h3 class="fcard__name">{{ a.name }}</h3>
                        <p class="fcard__tag">{{ a.tagline }}</p>
                    </div>
                    <span class="fcard__get">{{ a.price === 0 ? 'Загрузить' : a.price + ' ₽' }}</span>
                </div>
            </NuxtLink>
        </section>

        <!-- поиск + категории -->
        <div class="bar">
            <div class="search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.6" y2="16.6" />
                </svg>
                <input v-model="query" type="search" placeholder="Поиск приложений и игр…">
            </div>
        </div>

        <div class="cats">
            <button v-for="c in cats" :key="c" class="catbtn" :class="{ 'is-on': activeCat === c }"
                @click="activeCat = c">{{ c === 'all' ? 'Все категории' : c }}</button>
        </div>

        <p class="count">Найдено: {{ list.length }}</p>

        <div v-if="list.length" class="grid">
            <AppIconCard v-for="a in list" :key="a.id" :app="a" />
        </div>
        <div v-else class="empty card">
            <p>Ничего не нашлось.</p>
            <button class="btn btn--sm" @click="reset">Сбросить</button>
        </div>

        <!-- топ загрузок -->
        <section v-if="top.length" class="top">
            <h2>Топ загрузок</h2>
            <div class="grid grid--rank">
                <AppIconCard v-for="(a, i) in top" :key="a.id" :app="a" :rank="i + 1" />
            </div>
        </section>
    </div>
</template>

<style scoped>
.apps { padding-top: clamp(20px, 5vw, 36px); }
.apps__head {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap;
}
.apps__head h1 { font-size: clamp(24px, 6vw, 34px); }
.apps__head p { margin: 8px 0 0; font-size: 14px; }
.switch { display: flex; gap: 3px; padding: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); }
.switch button {
    min-height: 36px; padding: 0 14px; background: none; border: none; border-radius: var(--r-sm);
    color: var(--text-2); font-family: var(--f-mono); font-size: 12px;
}
.switch button.is-on { background: var(--p); color: #fff; }

/* витрина */
.feature { display: grid; grid-template-columns: 1fr; gap: 14px; margin: 22px 0 6px; }
@media (min-width: 720px) { .feature { grid-template-columns: repeat(2, 1fr); } }
.fcard {
    position: relative; display: block; padding: 18px; border-radius: var(--r-lg);
    border: 1px solid var(--border); overflow: hidden; color: inherit; background: var(--surf);
}
.fcard__bg { position: absolute; inset: 0; opacity: .16; filter: blur(30px) saturate(140%); }
.fcard__row { position: relative; display: flex; align-items: center; gap: 14px; }
.fcard__icon {
    width: 64px; height: 64px; flex: none; border-radius: 22%; display: grid; place-items: center;
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, .55), inset 0 0 0 1px rgba(255, 255, 255, .08);
}
.fcard__icon span { font-family: var(--f-display); font-weight: 800; font-size: 26px; color: #fff; }
.fcard__info { flex: 1; min-width: 0; }
.fcard__eyebrow { font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--p); }
.fcard__name { margin: 3px 0 2px; font-size: 18px; }
.fcard__tag { margin: 0; font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fcard__get {
    flex: none; padding: 8px 16px; border-radius: 99px; background: var(--p); color: #fff;
    font-family: var(--f-display); font-weight: 700; font-size: 13px;
}

/* поиск/категории */
.bar { display: flex; gap: 10px; margin: 22px 0 12px; }
.search {
    flex: 1; display: flex; align-items: center; gap: 9px; min-height: var(--tap); padding: 0 14px;
    background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); color: var(--muted);
}
.search:focus-within { border-color: var(--p); }
.search input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--text); font: inherit; }
.search input::placeholder { color: var(--muted); }
.cats { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
.catbtn {
    min-height: 36px; padding: 0 14px; background: rgba(255, 255, 255, .05); border: none; border-radius: 9px;
    color: #fff; font-weight: 300; font-size: 13.5px; transition: background .15s;
}
.catbtn:hover { background: rgba(255, 255, 255, .12); }
.catbtn.is-on { background: var(--p); }
.count { margin: 0 0 14px; font-family: var(--f-mono); font-size: 12px; color: var(--muted); }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
@media (min-width: 560px) { .grid { grid-template-columns: repeat(4, 1fr); gap: 12px; } }
@media (min-width: 900px) { .grid { grid-template-columns: repeat(6, 1fr); gap: 14px; } }

.empty { padding: 46px 20px; text-align: center; }
.empty p { margin: 0 0 16px; color: var(--text-2); }

.top { margin-top: clamp(32px, 6vw, 52px); }
.top h2 { font-size: clamp(18px, 4.4vw, 23px); margin-bottom: 16px; }
</style>
