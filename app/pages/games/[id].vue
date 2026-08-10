<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'
import type { DbGame } from '~~/server/db/games'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

// 1) реальная игра из БД (если есть). На 404/без базы data будет null.
const { data: real } = await useFetch<{ game: DbGame }>(
    () => `/api/games/${route.params.id}`, { default: () => null as any })
const dbGame = computed<DbGame | null>(() => real.value?.game ?? null)

// URL картинки → CSS-фон (обложки и скриншоты у реальных игр — это ссылки)
function bg(url: string | null): string {
    return url ? `url("${url}") center / cover no-repeat` : '#20082b'
}

// адаптер: строка БД → форма, которую ждёт эта страница (demo-shape)
function toGame(r: DbGame): Game {
    const d = r.releaseDate ? Number(r.releaseDate.replace(/-/g, '')) : 0
    const shots = r.screenshots.length ? r.screenshots.map(bg) : [bg(r.cover)]
    return {
        id: r.id, title: r.name, author: '—',
        tags: [r.genre, ...r.platforms].filter(Boolean),
        plays: 0, shows: 0, rating: r.rating, votes: r.ratingCount, price: r.price,
        cover: bg(r.icon || r.cover), date: d,
        engine: r.platforms[0] || '—', size: '—', web: false,
        desc: r.shortDescription || r.description.slice(0, 140),
        about: r.description || r.shortDescription, shots,
    }
}

// 2) запасной вариант — демо-игра по slug
const demo = findGame(String(route.params.id))
const game = dbGame.value ? toGame(dbGame.value) : demo
if (!game) throw createError({ statusCode: 404, statusMessage: 'Игра не найдена', fatal: true })

const x = gameExtra(game)
const summary = reviewSummary(x.reviews)
const similar = computed(() => similarGames(game!))

// ── медиа-галерея: трейлер (если есть) + скриншоты ──
interface Media { kind: 'video' | 'bg'; val: string; poster?: string }
const media = computed<Media[]>(() => {
    const arr: Media[] = []
    const tr = dbGame.value?.trailer
    if (tr) arr.push({ kind: 'video', val: tr, poster: dbGame.value?.screenshots[0] || dbGame.value?.banner || undefined })
    for (const s of game!.shots) arr.push({ kind: 'bg', val: s })
    return arr
})
function thumbStyle(m: Media) {
    if (m.kind === 'bg') return { background: m.val }
    return m.poster ? { background: bg(m.poster) } : undefined
}

const shot = ref(0)
const tab = ref<'players' | 'experts'>('players')
const collecting = ref(false)
const collected = ref(false)
const playing = ref(false)
const { ok, toast } = useToast()

const OWNED_KEY = 'dustore_collection'

// коллекция переживает перезагрузку
onMounted(() => {
    try {
        const owned: string[] = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]')
        collected.value = owned.includes(game!.id)
    } catch { /* пустая или битая — не страшно */ }
})

function addToCollection() {
    if (collected.value) {
        toast(t('collect.already'))
        return
    }
    collected.value = true
    collecting.value = true
    try {
        const owned: string[] = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]')
        owned.push(game!.id)
        localStorage.setItem(OWNED_KEY, JSON.stringify(owned))
    } catch { /* приватный режим — просто не сохраняем */ }
}

/** главная кнопка: играть / купить / скачать */
function mainAction() {
    if (game!.web) {
        playing.value = true
        return
    }
    if (game!.price > 0) {
        ok(t('play.added', { name: game!.title }))
        return
    }
    toast(t('play.downloading', { size: game!.size }))
}

const priceLabel = computed(() =>
    game!.price === 0 ? t('game.free') : `${game!.price.toLocaleString('ru-RU')} ₽`,
)
const releaseDate = computed(() => {
    const d = String(game!.date)
    if (!game!.date || d.length < 8) return '—'
    return `${d.slice(6, 8)}.${d.slice(4, 6)}.${d.slice(0, 4)}`
})

useSeoMeta({
    title: () => `${game!.title} — Dustore`,
    description: () => game!.desc,
    ogTitle: () => game!.title,
    ogDescription: () => game!.desc,
})
</script>

<template>
    <div v-if="game" class="wrap gp">
        <nav class="crumbs">
            <NuxtLink :to="localePath('/games')">{{ $t('catalog.title') }}</NuxtLink>
            <span>/</span><span class="muted">{{ game.title }}</span>
        </nav>

        <!-- ═════════ ВЕРХ ═════════ -->
        <div class="gp__top">
            <div class="gal">
                <div class="gal__main">
                    <video v-if="media[shot]?.kind === 'video'" class="gal__media" :src="media[shot].val"
                        :poster="media[shot].poster" controls playsinline />
                    <div v-else class="gal__media" :style="{ background: media[shot]?.val }">
                        <button v-if="game.web" class="gal__web" @click="playing = true">▶ {{ $t('game.playInBrowser')
                            }}</button>
                    </div>
                </div>
                <div class="gal__thumbs">
                    <button v-for="(m, i) in media" :key="i" class="gal__t" :class="{ 'is-on': i === shot }"
                        :style="thumbStyle(m)"
                        :aria-label="m.kind === 'video' ? 'Трейлер' : `${$t('game.screenshot')} ${i + 1}`"
                        @click="shot = i">
                        <span v-if="m.kind === 'video'" class="gal__play">▶</span>
                    </button>
                </div>
            </div>

            <aside class="buy">
                <div class="buy__cover" :style="{ background: game.cover }" />
                <h1 class="buy__title">{{ game.title }}</h1>
                <p class="buy__desc muted">{{ game.desc }}</p>

                <dl class="meta">
                    <div>
                        <dt>{{ $t('game.reviewsShort') }}</dt>
                        <dd><span class="pos">{{ summary.label }}</span> <span class="muted">({{ summary.total
                                }})</span></dd>
                    </div>
                    <div>
                        <dt>{{ $t('game.released') }}</dt>
                        <dd>{{ releaseDate }}</dd>
                    </div>
                    <div>
                        <dt>{{ $t('game.developer') }}</dt>
                        <dd>
                            <NuxtLink :to="localePath('/crews')" class="lnk">{{ game.author }}</NuxtLink>
                            <span class="vfd" :title="$t('game.verified')">✓</span>
                        </dd>
                    </div>
                    <div v-if="game.jam">
                        <dt>{{ $t('game.jamWin') }}</dt>
                        <dd class="jam">🏆 {{ game.jam }}</dd>
                    </div>
                </dl>

                <div class="chips">
                    <span class="chips__l muted">{{ $t('game.tags') }}:</span>
                    <NuxtLink v-for="tg in game.tags" :key="tg" :to="localePath('/games')" class="tag">{{ tg }}
                    </NuxtLink>
                </div>

                <div class="buy__box">
                    <div class="buy__price" :class="{ 'is-free': game.price === 0 }">{{ priceLabel }}</div>
                    <button class="btn btn--primary" @click="mainAction">
                        {{ game.web ? '▶ ' + $t('game.playNow') : (game.price ? $t('game.buy') : $t('game.download')) }}
                    </button>
                    <button class="btn" :class="{ 'is-owned': collected }" @click="addToCollection">
                        {{ collected ? '✓ ' + $t('collect.owned') : '＋ ' + $t('collect.add') }}
                    </button>
                </div>
            </aside>
        </div>

        <!-- ═════════ ОСНОВНОЕ ═════════ -->
        <div class="gp__body">
            <div class="gp__main">
                <!-- описание -->
                <section class="blk">
                    <h2>{{ $t('game.about') }}</h2>
                    <p class="about__body">{{ game.about }}</p>
                </section>

                <!-- отзывы -->
                <section class="blk">
                    <div class="blk__head">
                        <h2>{{ $t('game.reviewsTitle') }}</h2>
                        <div class="segs">
                            <button :class="{ 'is-on': tab === 'players' }" @click="tab = 'players'">
                                {{ $t('game.tabPlayers') }} <span>{{ x.reviews.length }}</span>
                            </button>
                            <button :class="{ 'is-on': tab === 'experts' }" @click="tab = 'experts'">
                                {{ $t('game.tabExperts') }} <span>{{ x.experts.length }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- сводка -->
                    <div v-if="tab === 'players'" class="sum">
                        <div class="sum__big"><b class="pos">{{ summary.label }}</b>
                            <span class="muted">{{ summary.pct }}% {{ $t('game.positive') }} · {{ summary.total
                                }}</span>
                        </div>
                        <div class="sum__bar">
                            <div :style="{ width: summary.pct + '%' }" />
                        </div>
                    </div>

                    <!-- отзывы игроков -->
                    <ul v-if="tab === 'players'" class="revs">
                        <li v-for="r in x.reviews" :key="r.user + r.date" class="rev">
                            <div class="rev__side">
                                <span class="rev__ava">{{ r.user.slice(0, 2).toUpperCase() }}</span>
                                <b class="rev__user">{{ r.user }}<span v-if="r.verified" class="vfd"
                                        :title="$t('game.verified')">✓</span></b>
                                <span class="muted rev__h">{{ r.hours }} {{ $t('game.hours') }}</span>
                            </div>
                            <div class="rev__body">
                                <div class="rev__top">
                                    <span class="rev__vote" :class="r.up ? 'up' : 'down'">{{ r.up ? '▲ ' +
                                        $t('game.recommend') : '▼ ' + $t('game.notRecommend') }}</span>
                                    <span class="muted rev__date">{{ r.date }}</span>
                                </div>
                                <p>{{ r.text }}</p>
                                <span class="muted rev__help">{{ r.helpful }} {{ $t('game.foundHelpful') }}</span>
                            </div>
                        </li>
                    </ul>

                    <!-- рецензии экспертов -->
                    <template v-else>
                        <div v-if="!x.experts.length" class="noexp card">
                            <p class="muted">{{ $t('game.noExperts') }}</p>
                        </div>
                        <article v-for="e in x.experts" :key="e.user" class="exp">
                            <header class="exp__head">
                                <span class="exp__ava">{{ e.user.slice(0, 2).toUpperCase() }}</span>
                                <div>
                                    <b>{{ e.user }}<span class="vfd">✓</span></b>
                                    <span class="muted exp__role">{{ e.role }}</span>
                                </div>
                                <div class="exp__score"><b>{{ e.score.toFixed(1) }}</b><span class="muted">/5</span>
                                </div>
                            </header>
                            <p class="exp__verdict">{{ e.verdict }}</p>
                            <div class="exp__pc">
                                <ul class="pros">
                                    <li v-for="p in e.pros" :key="p">+ {{ p }}</li>
                                </ul>
                                <ul class="cons">
                                    <li v-for="c in e.cons" :key="c">− {{ c }}</li>
                                </ul>
                            </div>
                        </article>
                    </template>
                </section>

                <!-- обновления -->
                <section class="blk">
                    <h2>{{ $t('game.updates') }}</h2>
                    <ul class="upd">
                        <li v-for="u in x.updates" :key="u.version">
                            <span class="upd__v">{{ u.version }}</span>
                            <span class="upd__t">{{ u.title }}</span>
                            <span class="muted upd__d">{{ u.date }}</span>
                        </li>
                    </ul>
                </section>
            </div>

            <!-- ═════════ ПРАВАЯ КОЛОНКА ═════════ -->
            <aside class="gp__side">
                <!-- антивирус -->
                <div class="panel scan" :class="`is-${x.scan.status}`">
                    <div class="scan__head">
                        <span class="scan__ic">🛡</span>
                        <div>
                            <b>{{ x.scan.status === 'clean' ? $t('game.scanClean') : $t('game.scanWarn') }}</b>
                            <span class="muted">{{ x.scan.flagged }} / {{ x.scan.engines }} {{ $t('game.engines')
                                }}</span>
                        </div>
                    </div>
                    <dl class="scan__meta">
                        <div>
                            <dt>{{ $t('game.scanned') }}</dt>
                            <dd>{{ x.scan.date }}</dd>
                        </div>
                        <div>
                            <dt>SHA-256</dt>
                            <dd class="mono">{{ x.scan.sha256 }}…</dd>
                        </div>
                    </dl>
                    <p class="scan__note muted">{{ $t('game.scanNote') }}</p>
                </div>

                <!-- характеристики -->
                <div class="panel">
                    <h3>{{ $t('game.specs') }}</h3>
                    <dl class="specs">
                        <div>
                            <dt>{{ $t('game.engine') }}</dt>
                            <dd>{{ game.engine }}</dd>
                        </div>
                        <div>
                            <dt>{{ $t('game.size') }}</dt>
                            <dd>{{ game.size }}</dd>
                        </div>
                        <div>
                            <dt>{{ $t('game.platform') }}</dt>
                            <dd>{{ game.web ? $t('game.web') : $t('game.desktop') }}</dd>
                        </div>
                        <div>
                            <dt>{{ $t('game.plays') }}</dt>
                            <dd>{{ fmtPlays(game.plays) }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- системные требования -->
                <div class="panel">
                    <h3>{{ $t('game.sysreq') }}</h3>
                    <dl class="specs specs--rows">
                        <div>
                            <dt>ОС</dt>
                            <dd>{{ x.sysreq.os }}</dd>
                        </div>
                        <div>
                            <dt>CPU</dt>
                            <dd>{{ x.sysreq.cpu }}</dd>
                        </div>
                        <div>
                            <dt>RAM</dt>
                            <dd>{{ x.sysreq.ram }}</dd>
                        </div>
                        <div>
                            <dt>GPU</dt>
                            <dd>{{ x.sysreq.gpu }}</dd>
                        </div>
                        <div>
                            <dt>{{ $t('game.disk') }}</dt>
                            <dd>{{ x.sysreq.disk }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- языки -->
                <div class="panel">
                    <h3>{{ $t('game.languages') }}</h3>
                    <table class="langs">
                        <thead>
                            <tr>
                                <th></th>
                                <th>{{ $t('game.ui') }}</th>
                                <th>{{ $t('game.voice') }}</th>
                                <th>{{ $t('game.subs') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="l in x.languages" :key="l.code">
                                <td>{{ l.code }}</td>
                                <td>{{ l.ui ? '✓' : '' }}</td>
                                <td>{{ l.voice ? '✓' : '' }}</td>
                                <td>{{ l.subs ? '✓' : '' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </aside>
        </div>

        <GameRail v-if="similar.length" :title="$t('game.similar')" :sub="$t('game.similar_d')" :games="similar"
            accent="var(--violet)" />

        <CollectFx v-model="collecting" :game="game" />
        <PlayOverlay v-model="playing" :game="game" />
    </div>
</template>

<style scoped>
.gp {
    padding-top: clamp(16px, 4vw, 28px);
}

.crumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--text-2);
}

.crumbs a:hover {
    color: var(--p);
}

.gp__top {
    display: grid;
    gap: 20px;
}

/* галерея */
.gal__main {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: var(--r-lg);
    border: 1px solid var(--border);
    overflow: hidden;
    background: #000;
}

.gal__media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-size: cover;
    background-position: center;
}

.gal__web {
    position: absolute;
    left: 14px;
    bottom: 14px;
    padding: 8px 16px;
    border: 1px solid rgba(46, 204, 113, .5);
    border-radius: 99px;
    background: rgba(0, 0, 0, .6);
    backdrop-filter: blur(6px);
    font-family: var(--f-mono);
    font-size: 12px;
    color: #2ecc71;
    cursor: pointer;
    transition: background .2s;
}

.gal__web:hover {
    background: rgba(46, 204, 113, .22);
}

.gal__thumbs {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
}

.gal__thumbs::-webkit-scrollbar {
    display: none;
}

.gal__t {
    position: relative;
    flex: 0 0 92px;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 0;
    opacity: .55;
    background-size: cover;
    background-position: center;
    transition: opacity .2s, border-color .2s;
}

.gal__t.is-on,
.gal__t:hover {
    opacity: 1;
    border-color: var(--p);
}

.gal__play {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 15px;
    background: rgba(0, 0, 0, .35);
}

/* правая панель покупки */
.buy {
    padding: 16px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
}

.buy__cover {
    height: 96px;
    border-radius: var(--r);
    margin-bottom: 14px;
}

.buy__title {
    font-size: clamp(20px, 5vw, 26px);
}

.buy__desc {
    margin: 8px 0 0;
    font-size: 13.5px;
    line-height: 1.5;
}

.meta {
    margin: 16px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.meta>div {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 10px;
    align-items: baseline;
}

.meta dt {
    font-family: var(--f-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: .4px;
    color: var(--muted);
}

.meta dd {
    margin: 0;
    font-size: 13px;
}

.pos {
    color: #66c0f4;
    font-weight: 600;
}

.lnk {
    color: #66c0f4;
}

.lnk:hover {
    text-decoration: underline;
}

.jam {
    color: #d9a6e0;
}

.vfd {
    display: inline-grid;
    place-items: center;
    width: 14px;
    height: 14px;
    margin-left: 4px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-size: 9px;
    vertical-align: middle;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 14px;
}

.chips__l {
    font-family: var(--f-mono);
    font-size: 10.5px;
    text-transform: uppercase;
}

.chips .tag {
    padding: 4px 10px;
}

.chips .tag:hover {
    color: var(--p);
}

.buy__box {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.buy__price {
    font-family: var(--f-mono);
    font-size: 24px;
    font-weight: 600;
    color: var(--warn);
}

.buy__price.is-free {
    color: #2ecc71;
}

.buy__box .btn {
    width: 100%;
}

.btn.is-owned {
    border-color: #2ecc71;
    color: #2ecc71;
}

/* тело */
.gp__body {
    display: grid;
    gap: 22px;
    margin-top: clamp(26px, 5vw, 40px);
}

.blk+.blk {
    margin-top: clamp(26px, 5vw, 40px);
}

.blk h2 {
    font-size: clamp(18px, 4.4vw, 22px);
}

.blk__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.about__body {
    margin: 12px 0 0;
    font-size: 15px;
    line-height: 1.65;
    max-width: 720px;
}

.segs {
    display: flex;
    gap: 3px;
    padding: 3px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.segs button {
    min-height: 34px;
    padding: 0 13px;
    background: none;
    border: none;
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 12px;
}

.segs button.is-on {
    background: var(--p);
    color: #fff;
}

.segs span {
    opacity: .65;
    margin-left: 3px;
}

/* сводка отзывов */
.sum {
    margin: 16px 0 14px;
    padding: 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.sum__big {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 14px;
}

.sum__bar {
    height: 8px;
    margin-top: 10px;
    border-radius: 4px;
    background: rgba(255, 255, 255, .08);
    overflow: hidden;
}

.sum__bar div {
    height: 100%;
    background: linear-gradient(90deg, #66c0f4, #2ecc71);
}

/* отзывы */
.revs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.rev {
    display: grid;
    gap: 12px;
    padding: 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.rev__side {
    display: flex;
    align-items: center;
    gap: 9px;
}

.rev__ava {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 9px;
    background: var(--surf-2);
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 12px;
}

.rev__user {
    font-size: 13.5px;
}

.rev__h {
    font-family: var(--f-mono);
    font-size: 11px;
    margin-left: auto;
}

.rev__top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.rev__vote {
    font-family: var(--f-mono);
    font-size: 11.5px;
}

.rev__vote.up {
    color: #66c0f4;
}

.rev__vote.down {
    color: var(--err);
}

.rev__date {
    font-family: var(--f-mono);
    font-size: 11px;
}

.rev__body p {
    margin: 8px 0;
    font-size: 14px;
    line-height: 1.55;
}

.rev__help {
    font-size: 11.5px;
}

/* эксперты */
.noexp {
    padding: 26px;
    text-align: center;
}

.exp {
    padding: 16px;
    margin-top: 12px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-left: 3px solid var(--violet);
    border-radius: 0 var(--r) var(--r) 0;
}

.exp__head {
    display: flex;
    align-items: center;
    gap: 11px;
}

.exp__ava {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 10px;
    background: var(--violet);
    color: #fff;
    font-family: var(--f-mono);
    font-size: 13px;
}

.exp__head b {
    display: block;
    font-size: 14px;
}

.exp__role {
    font-family: var(--f-mono);
    font-size: 11px;
}

.exp__score {
    margin-left: auto;
    text-align: right;
}

.exp__score b {
    font-family: var(--f-mono);
    font-size: 22px;
    color: var(--violet);
}

.exp__verdict {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
}

.exp__pc {
    display: grid;
    gap: 10px;
}

.exp__pc ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13px;
}

.pros li {
    color: #2ecc71;
}

.cons li {
    color: #ff9b9c;
}

/* обновления */
.upd {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
}

.upd li {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
}

.upd__v {
    font-family: var(--f-mono);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 5px;
    background: var(--surf-2);
    color: var(--p);
}

.upd__t {
    flex: 1;
    font-size: 13.5px;
    min-width: 180px;
}

.upd__d {
    font-family: var(--f-mono);
    font-size: 11px;
}

/* правая колонка */
.gp__side {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.panel {
    padding: 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.panel h3 {
    font-size: 14px;
    margin-bottom: 12px;
}

.scan.is-clean {
    border-color: rgba(46, 204, 113, .4);
}

.scan__head {
    display: flex;
    align-items: center;
    gap: 11px;
}

.scan__ic {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 9px;
    background: rgba(46, 204, 113, .15);
    font-size: 17px;
}

.scan__head b {
    display: block;
    font-size: 13.5px;
    color: #2ecc71;
}

.scan__head span {
    font-family: var(--f-mono);
    font-size: 11px;
}

.scan__meta {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 12px 0 0;
}

.scan__meta>div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.scan__meta dt {
    font-family: var(--f-mono);
    font-size: 10.5px;
    color: var(--muted);
    text-transform: uppercase;
}

.scan__meta dd {
    margin: 0;
    font-size: 12px;
}

.mono {
    font-family: var(--f-mono);
}

.scan__note {
    margin: 11px 0 0;
    font-size: 11px;
    line-height: 1.45;
}

.specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
    margin: 0;
}

.specs--rows {
    grid-template-columns: 1fr;
    gap: 8px;
}

.specs--rows>div {
    display: grid;
    grid-template-columns: 46px 1fr;
    gap: 10px;
    align-items: baseline;
}

.specs dt {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .4px;
}

.specs dd {
    margin: 2px 0 0;
    font-size: 12.5px;
    font-weight: 600;
}

.specs--rows dd {
    margin: 0;
    font-weight: 500;
}

.langs {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.langs th {
    font-family: var(--f-mono);
    font-size: 9.5px;
    font-weight: 400;
    color: var(--muted);
    text-transform: uppercase;
    text-align: center;
    padding-bottom: 7px;
}

.langs th:first-child {
    text-align: left;
}

.langs td {
    padding: 5px 0;
    border-top: 1px solid var(--border);
    text-align: center;
    color: #2ecc71;
}

.langs td:first-child {
    text-align: left;
    color: var(--text);
}

@media (min-width: 900px) {
    .gp__top {
        grid-template-columns: 1fr 360px;
        align-items: start;
    }

    .gp__body {
        grid-template-columns: 1fr 300px;
        align-items: start;
    }

    .rev {
        grid-template-columns: 150px 1fr;
    }

    .rev__side {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }

    .rev__h {
        margin-left: 0;
    }

    .exp__pc {
        grid-template-columns: 1fr 1fr;
    }
}
</style>