<script setup lang="ts">
import { useLocalePath } from '#imports'

/**
 * Краудфандинг Dustore — пока только проработанный дизайн (статические данные),
 * в стиле платформы: плавающие острова, магента-акцент, баннеры «растворяются».
 */

const localePath = useLocalePath()
const { toast } = useToast()

useSeoMeta({ title: 'Краудфандинг — Dustore', description: 'Поддержи независимых разработчиков и получи уникальные награды.' })

const categories = ['Все', 'Экшен', 'Приключения', 'РПГ', 'Стратегии', 'Хоррор', 'Симуляторы', 'Головоломки', 'Другое']
const activeCat = ref('Все')
const filters = ['Популярные', 'Новые', 'Скоро завершение', 'Рекомендуемые']
const activeFilter = ref('Популярные')

const featured = {
    title: 'TALES OF ELYSIUM',
    tagline: 'Открытый фэнтези-мир, где каждое ваше решение меняет историю.',
    raised: 3450000, goal: 5000000, pct: 69, daysLeft: 24,
    bg: 'linear-gradient(135deg, #3a1250 0%, #6a1e6e 55%, #1d0726 100%)',
}

interface Proj { id: string; title: string; cat: string; desc: string; raised: number; goal: number; pct: number; days: number; bg: string }
const projects: Proj[] = [
    { id: 'neonwords', title: 'NEON WORDS', cat: 'Хоррор', desc: 'Психологический хоррор о словах, которые меняют реальность.', raised: 1250000, goal: 2000000, pct: 62, days: 18, bg: 'linear-gradient(135deg,#2a0b33,#7a2f55)' },
    { id: 'aria', title: 'Chronicles of Aria', cat: 'Приключения', desc: 'Классическое приключение в мире, полном тайн и магии.', raised: 2150000, goal: 3000000, pct: 71, days: 27, bg: 'linear-gradient(135deg,#123650,#2f6e6e)' },
    { id: 'awakening', title: 'Project: Awakening', cat: 'Экшен', desc: 'Динамичный экшен в киберпанк-вселенной будущего.', raised: 4230000, goal: 5000000, pct: 86, days: 10, bg: 'linear-gradient(135deg,#14243f,#185fa5)' },
    { id: 'pixelrealms', title: 'Pixel Realms', cat: 'РПГ', desc: 'Ретро-RPG с современным геймплеем и духом классики.', raised: 980000, goal: 2000000, pct: 49, days: 32, bg: 'linear-gradient(135deg,#17340a,#3b6d11)' },
    { id: 'cyberdungeon', title: 'Cyber Dungeon', cat: 'РПГ', desc: 'Рогалик в неоновом подземелье с процедурной генерацией.', raised: 2890000, goal: 4000000, pct: 72, days: 15, bg: 'linear-gradient(135deg,#2c1e4a,#7F77DD)' },
    { id: 'lasthorizon', title: 'Last Horizon', cat: 'Симуляторы', desc: 'Космический симулятор выживания на краю галактики.', raised: 1560000, goal: 3000000, pct: 52, days: 21, bg: 'linear-gradient(135deg,#1e3a4a,#5DCAA5)' },
]
const trending = [
    { title: 'Project: Awakening', raised: 4230000, pct: 86, bg: 'linear-gradient(135deg,#14243f,#185fa5)' },
    { title: 'Cyber Dungeon', raised: 2890000, pct: 72, bg: 'linear-gradient(135deg,#2c1e4a,#7F77DD)' },
    { title: 'Last Horizon', raised: 1560000, pct: 52, bg: 'linear-gradient(135deg,#1e3a4a,#5DCAA5)' },
]
const activity = [
    { user: 'Alex', text: 'поддержал проект NEON WORDS на 500 ₽', ago: '2 мин назад' },
    { user: 'Maria', text: 'получила награду в проекте Mindcell', ago: '15 мин назад' },
    { user: 'Тимур', text: 'создал проект Skyline Racers', ago: '32 мин назад' },
]

const shown = computed(() => activeCat.value === 'Все' ? projects : projects.filter(p => p.cat === activeCat.value))

function money(n: number) { return n.toLocaleString('ru-RU') + ' ₽' }
function soon() { toast('Краудфандинг — скоро. Пока это дизайн-превью ✦') }
</script>

<template>
    <div class="wrap fund">
        <div class="fund__grid">
            <!-- ── ОСНОВНОЕ ── -->
            <div class="fund__main">
                <!-- избранный проект -->
                <section class="feat island">
                    <div class="feat__bg" :style="{ background: featured.bg }" />
                    <div class="feat__in">
                        <span class="feat__pick">★ Выбор редакции</span>
                        <h1 class="feat__title">{{ featured.title }}</h1>
                        <p class="feat__tag">{{ featured.tagline }}</p>

                        <div class="feat__fund">
                            <div class="feat__row">
                                <div>
                                    <div class="feat__lbl">Собрано</div>
                                    <div class="feat__sum">{{ money(featured.raised) }}</div>
                                </div>
                                <div class="feat__pct">{{ featured.pct }}%</div>
                            </div>
                            <div class="bar"><div class="bar__fill" :style="{ width: featured.pct + '%' }" /></div>
                            <div class="feat__meta">
                                <span class="muted">Цель: {{ money(featured.goal) }}</span>
                                <span class="muted">Осталось {{ featured.daysLeft }} дня</span>
                            </div>
                        </div>

                        <div class="feat__cta">
                            <button class="btn btn--primary" @click="soon">Поддержать проект</button>
                            <button class="iconbtn" aria-label="В избранное" @click="soon">♡</button>
                            <button class="trailer" @click="soon"><span class="trailer__play">▶</span> Смотреть трейлер</button>
                        </div>
                        <div class="feat__dots"><span class="on" /><span /><span /><span /></div>
                    </div>
                </section>

                <!-- фильтры -->
                <div class="tabs">
                    <button v-for="f in filters" :key="f" class="tab" :class="{ on: activeFilter === f }"
                        @click="activeFilter = f">{{ f }}</button>
                    <div class="tabs__sp" />
                    <button class="sel" @click="soon">Все категории ▾</button>
                    <button class="sel" @click="soon">Любая цель ▾</button>
                </div>

                <!-- категории -->
                <div class="cats">
                    <button v-for="c in categories" :key="c" class="catb" :class="{ on: activeCat === c }"
                        @click="activeCat = c">{{ c }}</button>
                </div>

                <!-- сетка проектов -->
                <div class="cards">
                    <article v-for="p in shown" :key="p.id" class="pcard island">
                        <div class="pcard__cover" :style="{ background: p.bg }">
                            <span class="pcard__cat">{{ p.cat }}</span>
                            <button class="pcard__fav" aria-label="В избранное" @click="soon">♡</button>
                        </div>
                        <div class="pcard__body">
                            <h3 class="pcard__title">{{ p.title }}</h3>
                            <p class="pcard__desc">{{ p.desc }}</p>
                            <div class="pcard__nums">
                                <span class="pcard__sum">{{ money(p.raised) }}</span>
                                <span class="pcard__pct">{{ p.pct }}%</span>
                            </div>
                            <div class="bar"><div class="bar__fill" :style="{ width: p.pct + '%' }" /></div>
                            <div class="pcard__meta muted">
                                <span>Цель: {{ money(p.goal) }}</span>
                                <span>Осталось {{ p.days }} дней</span>
                            </div>
                        </div>
                    </article>
                </div>

                <div class="more">
                    <button class="btn" @click="soon">Показать больше проектов</button>
                </div>
            </div>

            <!-- ── ПРАВЫЙ РЕЙЛ ── -->
            <aside class="fund__rail">
                <div class="promo island">
                    <div class="promo__glow" />
                    <h3>Станьте частью будущих игр</h3>
                    <p class="muted">Поддерживайте независимых разработчиков и получайте уникальные награды.</p>
                    <button class="btn btn--primary btn--sm" @click="soon">Как это работает</button>
                </div>

                <div class="island rail-block">
                    <div class="rail-head">
                        <h3>🔥 В тренде</h3>
                        <button class="rail-all" @click="soon">Смотреть все</button>
                    </div>
                    <div v-for="t in trending" :key="t.title" class="trend">
                        <span class="trend__cover" :style="{ background: t.bg }" />
                        <div class="trend__i">
                            <div class="trend__title">{{ t.title }}</div>
                            <div class="trend__row">
                                <span class="muted">{{ money(t.raised) }}</span>
                                <span class="trend__pct">{{ t.pct }}%</span>
                            </div>
                            <div class="bar bar--sm"><div class="bar__fill" :style="{ width: t.pct + '%' }" /></div>
                        </div>
                    </div>
                </div>

                <div class="island rail-block">
                    <h3>Недавняя активность</h3>
                    <div v-for="(a, i) in activity" :key="i" class="act">
                        <span class="act__ava">{{ a.user.slice(0, 1) }}</span>
                        <div class="act__i">
                            <p><b>{{ a.user }}</b> {{ a.text }}</p>
                            <span class="muted act__ago">{{ a.ago }}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.fund { padding-top: clamp(16px, 3vw, 26px); }
.fund__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
@media (min-width: 1100px) { .fund__grid { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; } }
.fund__main { display: flex; flex-direction: column; gap: 18px; }

/* островок */
.island {
    background: linear-gradient(180deg, rgba(52, 16, 68, .55), rgba(28, 8, 38, .55));
    border: 1px solid rgba(195, 33, 120, .22);
    border-radius: 20px;
    box-shadow: 0 10px 34px -8px rgba(0, 0, 0, .5), 0 1px 0 rgba(255, 255, 255, .05) inset;
    backdrop-filter: blur(12px) saturate(140%);
}

.bar { height: 8px; border-radius: 5px; background: rgba(255, 255, 255, .08); overflow: hidden; }
.bar--sm { height: 5px; margin-top: 5px; }
.bar__fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #7fff9f, #42d37d); }

/* ── избранный ── */
.feat { position: relative; overflow: hidden; min-height: 340px; padding: clamp(20px, 4vw, 36px); }
.feat__bg {
    position: absolute; inset: 0;
    /* баннер «растворяется» к низу и вправо */
    -webkit-mask-image: linear-gradient(105deg, #000 20%, transparent 78%);
    mask-image: linear-gradient(105deg, #000 20%, transparent 78%);
    opacity: .9;
}
.feat__in { position: relative; max-width: 560px; }
.feat__pick {
    display: inline-block; font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--warn); background: rgba(0, 0, 0, .45); padding: 5px 11px; border-radius: 7px;
}
.feat__title { margin: 16px 0 0; font-size: clamp(30px, 6vw, 52px); line-height: 1; letter-spacing: -.01em; }
.feat__tag { margin: 12px 0 0; font-size: 16px; color: var(--text); max-width: 420px; }
.feat__fund { margin: 22px 0 0; max-width: 460px; }
.feat__row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.feat__lbl { font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.feat__sum { font-family: var(--f-display); font-weight: 800; font-size: 28px; }
.feat__pct { font-family: var(--f-mono); font-size: 20px; color: var(--ok); }
.feat__meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12.5px; }
.feat__cta { display: flex; align-items: center; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
.iconbtn { width: 46px; height: 46px; border: 1px solid var(--border); border-radius: 12px; background: rgba(0, 0, 0, .3); color: var(--text); font-size: 18px; }
.iconbtn:hover { border-color: var(--p); color: var(--p); }
.trailer { display: inline-flex; align-items: center; gap: 10px; background: none; border: none; color: var(--text); font-size: 14px; }
.trailer__play { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--border); border-radius: 50%; background: rgba(0, 0, 0, .3); }
.trailer:hover .trailer__play { border-color: var(--p); color: var(--p); }
.feat__dots { display: flex; gap: 6px; margin-top: 18px; }
.feat__dots span { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, .25); }
.feat__dots span.on { width: 20px; border-radius: 4px; background: var(--p); }

/* ── фильтры / категории ── */
.tabs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tab { padding: 8px 16px; border-radius: 99px; background: none; border: none; color: var(--text-2); font-size: 13.5px; font-weight: 500; }
.tab.on { background: var(--p); color: #fff; }
.tabs__sp { flex: 1; }
.sel { padding: 8px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--surf); color: var(--text-2); font-size: 12.5px; }
.cats { display: flex; flex-wrap: wrap; gap: 7px; }
.catb { padding: 6px 13px; border-radius: 99px; background: rgba(255, 255, 255, .05); border: none; color: var(--text-2); font-size: 12.5px; }
.catb.on { background: color-mix(in srgb, var(--p) 20%, transparent); color: #fff; }
.catb:hover { color: #fff; }

/* ── карточки проектов ── */
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (min-width: 1400px) { .cards { grid-template-columns: repeat(3, 1fr); } }
.pcard { overflow: hidden; display: flex; flex-direction: column; transition: transform .18s, border-color .18s; }
.pcard:hover { transform: translateY(-3px); border-color: rgba(195, 33, 120, .5); }
.pcard__cover { position: relative; aspect-ratio: 16 / 10; -webkit-mask-image: linear-gradient(180deg, #000 62%, transparent); mask-image: linear-gradient(180deg, #000 62%, transparent); }
.pcard__cat { position: absolute; top: 10px; left: 10px; font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--text); background: rgba(0, 0, 0, .55); padding: 3px 8px; border-radius: 6px; }
.pcard__fav { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border: none; border-radius: 9px; background: rgba(0, 0, 0, .5); color: #fff; font-size: 15px; }
.pcard__fav:hover { color: var(--p); }
.pcard__body { padding: 4px 16px 16px; margin-top: -14px; position: relative; }
.pcard__title { font-family: var(--f-display); font-size: 17px; }
.pcard__desc { margin: 6px 0 12px; font-size: 13px; line-height: 1.5; color: var(--text-2); min-height: 39px; }
.pcard__nums { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
.pcard__sum { font-family: var(--f-mono); font-weight: 600; font-size: 15px; }
.pcard__pct { font-family: var(--f-mono); font-size: 13px; color: var(--ok); }
.pcard__meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; }
.more { display: flex; justify-content: center; margin-top: 6px; }

/* ── правый рейл ── */
.fund__rail { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 14px; }
.promo { position: relative; overflow: hidden; padding: 18px; }
.promo__glow { position: absolute; top: -40px; right: -30px; width: 160px; height: 160px; border-radius: 50%; background: var(--p); filter: blur(60px); opacity: .35; }
.promo h3 { position: relative; font-family: var(--f-display); font-size: 17px; }
.promo p { position: relative; margin: 8px 0 14px; font-size: 13px; line-height: 1.5; }
.rail-block { padding: 16px; }
.rail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rail-block h3 { font-family: var(--f-display); font-size: 16px; margin-bottom: 12px; }
.rail-head h3 { margin: 0; }
.rail-all { background: none; border: none; color: var(--p); font-size: 12px; }
.trend { display: flex; gap: 11px; padding: 8px 0; }
.trend__cover { width: 46px; height: 46px; flex: none; border-radius: 10px; }
.trend__i { flex: 1; min-width: 0; }
.trend__title { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trend__row { display: flex; justify-content: space-between; gap: 8px; margin-top: 3px; font-size: 12px; }
.trend__pct { font-family: var(--f-mono); color: var(--ok); }
.act { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--border); }
.act:first-of-type { border-top: none; }
.act__ava { display: grid; place-items: center; width: 30px; height: 30px; flex: none; border-radius: 50%; background: var(--p); color: #fff; font-family: var(--f-mono); font-size: 12px; }
.act__i p { margin: 0; font-size: 12.5px; line-height: 1.4; }
.act__ago { font-family: var(--f-mono); font-size: 10.5px; }
</style>
