<script setup lang="ts">
import { useLocalePath } from '#imports'

definePageMeta({ layout: 'console' })

/** Command Center — «коворкинг» студии, а не скучный дашборд. */
const localePath = useLocalePath()
const { toast } = useToast()

interface Project { id: string; name: string; genre: string; status: string; cover: string | null; rating: number; ratingCount: number }
const { data } = await useFetch<{ projects: Project[]; studio: any }>('/api/console/projects', { default: () => ({ projects: [], studio: null }) })
const projects = computed(() => data.value?.projects ?? [])

/* ── активные проекты (реальные) ── */
function pct(p: Project) { return Math.max(6, Math.min(100, Math.round(p.rating * 20))) } // прогресс ~ из GQI, временно
function cover(p: Project) { return p.cover && p.cover.startsWith('http') ? { backgroundImage: `url("${p.cover}")` } : undefined }
const STATUS: Record<string, string> = { published: 'опубликован', draft: 'в разработке', closed: 'закрыт' }

/* ── метрики (плейсхолдер) ── */
function spark(d: number[]) {
    const max = Math.max(...d), min = Math.min(...d), w = 100, h = 34
    return d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ')
}
const perf = [
    { key: 'Игроки', val: '12.4K', delta: '+18.6%', color: 'var(--p)', data: [4, 6, 5, 8, 7, 10, 9, 12] },
    { key: 'Сессии', val: '34.7K', delta: '+11.3%', color: '#378add', data: [8, 7, 9, 8, 11, 10, 13, 14] },
    { key: 'Доход', val: '8.9K ₽', delta: '+24.7%', color: 'var(--ok)', data: [3, 4, 4, 6, 5, 7, 8, 9] },
]
const platforms = [
    { name: 'Steam', pct: 45, color: '#7F77DD' },
    { name: 'Epic Games', pct: 30, color: '#378add' },
    { name: 'PlayStation', pct: 15, color: '#c32178' },
    { name: 'Xbox', pct: 10, color: '#1D9E75' },
]
// сегменты пончика (dasharray по окружности r=52 → C≈326.7)
const C = 2 * Math.PI * 52
const donut = computed(() => {
    let acc = 0
    return platforms.map(p => {
        const seg = { color: p.color, dash: (p.pct / 100) * C, gap: C, offset: -acc }
        acc += (p.pct / 100) * C
        return seg
    })
})

const events = [
    { t: 'Ежедневный стендап', d: '21 мая · 10:00', ic: 'groups' },
    { t: 'Дедлайн билда', d: '25 мая · 23:59', ic: 'flag' },
    { t: 'Альфа-плейтест', d: '30 мая · 14:00', ic: 'sports_esports' },
]
const notifs = [
    { t: 'Билд собран', d: 'v0.7.3.45 готов к тестам', ic: 'check_circle', ok: true },
    { t: 'Новый комментарий', d: 'к AI-системе — «оптимизируем»', ic: 'chat', ok: false },
    { t: 'Обслуживание серверов', d: '22 мая · 02:00', ic: 'build', ok: false },
]

/* ── коммуникации ── */
const activity = [
    { t: 'Билд v0.7.3.45', d: 'прод-сборка завершена', ago: '2м', ic: 'task_alt', ok: true },
    { t: 'Импорт ассета', d: 'Cyberpunk_Street.glb', ago: '15м', ic: 'add_photo_alternate', ok: false },
    { t: 'Баг #4231 исправлен', d: 'коллизии игрока', ago: '1ч', ic: 'bug_report', ok: true },
    { t: 'Задача закрыта', d: 'переработка AI-системы', ago: '2ч', ic: 'check', ok: true },
    { t: 'Тест пройден', d: 'нагрузочный #45', ago: '3ч', ic: 'verified', ok: true },
]
const voiceMembers = ['МО', 'ДВ', 'СЛ', 'ТМ']
const chat = ref([
    { u: 'Майя', a: 'М', ago: '10:24', text: 'Залила новые анимации персонажа!' },
    { u: 'Алекс', a: 'А', ago: '10:25', text: 'Выглядит супер 🔥' },
    { u: 'Леон', a: 'Л', ago: '10:26', text: 'Гляну билд и отпишусь.' },
])
const msg = ref('')
function send() {
    const t = msg.value.trim(); if (!t) return
    chat.value.push({ u: 'Вы', a: 'Я', ago: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), text: t })
    msg.value = ''
}
const inVoice = ref(true)

useSeoMeta({ title: 'Обзор — Dustore.Devs' })
</script>

<template>
    <div class="cc">
        <div class="cc__main">
            <!-- ═══ COMMAND CENTER — офис студии с участниками ═══ -->
            <StudioOffice />

            <!-- ═══ ПАНЕЛИ ═══ -->
            <div class="panels">
                <!-- активные проекты -->
                <section class="card panel projs">
                    <div class="panel__head">
                        <h3>Активные проекты</h3>
                        <NuxtLink :to="localePath('/console/projects')" class="panel__all">Все →</NuxtLink>
                    </div>
                    <div v-if="!projects.length" class="pempty muted">Проектов пока нет</div>
                    <NuxtLink v-for="p in projects.slice(0, 3)" :key="p.id" :to="localePath(`/console/edit?id=${p.id}`)"
                        class="prow">
                        <span class="prow__cover" :style="cover(p)" />
                        <div class="prow__i">
                            <div class="prow__name">{{ p.name }}</div>
                            <div class="prow__sub muted">{{ p.genre || STATUS[p.status] }}</div>
                            <div class="pbar"><span :style="{ width: pct(p) + '%' }" /></div>
                        </div>
                        <span class="prow__pct">{{ pct(p) }}%</span>
                    </NuxtLink>
                </section>

                <!-- метрики -->
                <section class="card panel">
                    <div class="panel__head"><h3>Показатели</h3><span class="muted small">7 дней</span></div>
                    <div class="perf">
                        <div v-for="m in perf" :key="m.key" class="metric">
                            <div class="metric__k muted">{{ m.key }}</div>
                            <div class="metric__v">{{ m.val }}</div>
                            <div class="metric__d" :style="{ color: 'var(--ok)' }">{{ m.delta }}</div>
                            <svg class="metric__spark" viewBox="0 0 100 34" preserveAspectRatio="none">
                                <polyline :points="spark(m.data)" fill="none" :stroke="m.color" stroke-width="2.5"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>
                </section>

                <!-- платформы -->
                <section class="card panel">
                    <div class="panel__head"><h3>Платформы</h3></div>
                    <div class="plat">
                        <svg class="donut" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surf-2)" stroke-width="14" />
                            <circle v-for="(s, i) in donut" :key="i" cx="60" cy="60" r="52" fill="none" :stroke="s.color"
                                stroke-width="14" :stroke-dasharray="`${s.dash} ${s.gap}`" :stroke-dashoffset="s.offset"
                                transform="rotate(-90 60 60)" stroke-linecap="butt" />
                        </svg>
                        <ul class="plat__legend">
                            <li v-for="p in platforms" :key="p.name">
                                <span class="dot" :style="{ background: p.color }" />{{ p.name }}
                                <b>{{ p.pct }}%</b>
                            </li>
                        </ul>
                    </div>
                </section>

                <!-- события -->
                <section class="card panel">
                    <div class="panel__head"><h3>Ближайшие события</h3></div>
                    <div v-for="e in events" :key="e.t" class="line">
                        <span class="line__ic material-icons">{{ e.ic }}</span>
                        <div class="line__i"><div class="line__t">{{ e.t }}</div><div class="muted small">{{ e.d }}</div></div>
                    </div>
                </section>

                <!-- уведомления -->
                <section class="card panel">
                    <div class="panel__head"><h3>Уведомления</h3></div>
                    <div v-for="n in notifs" :key="n.t" class="line">
                        <span class="line__ic material-icons" :class="{ ok: n.ok }">{{ n.ic }}</span>
                        <div class="line__i"><div class="line__t">{{ n.t }}</div><div class="muted small">{{ n.d }}</div></div>
                    </div>
                </section>
            </div>
        </div>

        <!-- ═══ КОММУНИКАЦИИ ═══ -->
        <aside class="cc__rail">
            <section class="card panel">
                <div class="panel__head"><h3>Лента активности</h3></div>
                <div v-for="a in activity" :key="a.t" class="line">
                    <span class="line__ic material-icons" :class="{ ok: a.ok }">{{ a.ic }}</span>
                    <div class="line__i">
                        <div class="line__t">{{ a.t }}</div><div class="muted small">{{ a.d }}</div>
                    </div>
                    <span class="muted small line__ago">{{ a.ago }}</span>
                </div>
            </section>

            <section class="card panel voice">
                <div class="panel__head"><h3>Голосовой канал</h3></div>
                <div class="voice__name">Studio Room</div>
                <div class="wave"><span v-for="n in 40" :key="n" :style="{ animationDelay: (n * 0.045) + 's' }" /></div>
                <div class="voice__foot">
                    <div class="voice__mem">
                        <span v-for="m in voiceMembers" :key="m" class="vava">{{ m }}</span>
                        <span class="vava vava--n">+2</span>
                    </div>
                    <button class="voice__leave" :class="{ off: !inVoice }" @click="inVoice = !inVoice">
                        <span class="material-icons">{{ inVoice ? 'call_end' : 'call' }}</span>
                    </button>
                </div>
            </section>

            <section class="card panel chat">
                <div class="panel__head"><h3>Командный чат</h3><span class="muted small"># general</span></div>
                <div class="chat__list">
                    <div v-for="(c, i) in chat" :key="i" class="cmsg">
                        <span class="cmsg__ava">{{ c.a }}</span>
                        <div class="cmsg__i">
                            <div class="cmsg__top"><b>{{ c.u }}</b><span class="muted small">{{ c.ago }}</span></div>
                            <p>{{ c.text }}</p>
                        </div>
                    </div>
                </div>
                <form class="chat__bar" @submit.prevent="send">
                    <input v-model="msg" placeholder="Написать сообщение…">
                    <button type="submit" aria-label="Отправить"><span class="material-icons">send</span></button>
                </form>
            </section>
        </aside>
    </div>
</template>

<style scoped>
.cc { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
@media (min-width: 1200px) { .cc { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; } }
.cc__main { display: flex; flex-direction: column; gap: 18px; }

.card { background: var(--surf); border: 1px solid var(--border); border-radius: 16px; }
.panel { padding: 16px; }
.panel__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.panel__head h3 { font-family: var(--f-display); font-size: 15px; }
.panel__all { font-family: var(--f-mono); font-size: 12px; color: var(--text-2); }
.panel__all:hover { color: var(--p); }
.small { font-size: 11px; }

/* ═══ HUB ═══ */
.hub {
    position: relative; min-height: 340px; border-radius: 20px; overflow: hidden;
    border: 1px solid rgba(195, 33, 120, .25);
    background: radial-gradient(ellipse at 50% 30%, #3a1250 0%, #1d0726 55%, #0e0413 100%);
    box-shadow: 0 14px 40px -10px rgba(0, 0, 0, .6), 0 1px 0 rgba(255, 255, 255, .05) inset;
}
.hub__grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(195, 33, 120, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(195, 33, 120, .12) 1px, transparent 1px);
    background-size: 40px 40px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 45%, #000 30%, transparent 80%);
    mask-image: radial-gradient(ellipse at 50% 45%, #000 30%, transparent 80%);
    transform: perspective(600px) rotateX(52deg) scale(1.6); transform-origin: 50% 40%;
}
.hub__core {
    position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%);
    display: grid; place-items: center; width: 96px; height: 96px; border-radius: 26px;
    background: radial-gradient(circle at 50% 35%, #d16bd8, #7a1f8f 72%);
    box-shadow: 0 0 60px 6px rgba(195, 33, 120, .55);
    animation: corePulse 3.6s ease-in-out infinite;
}
.hub__mark { font-size: 40px; color: #fff; filter: drop-shadow(0 2px 8px rgba(0, 0, 0, .5)); }
@keyframes corePulse { 0%, 100% { box-shadow: 0 0 60px 6px rgba(195, 33, 120, .5); } 50% { box-shadow: 0 0 84px 14px rgba(195, 33, 120, .75); } }

.room {
    position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 9px;
    padding: 8px 12px; border: 1px solid rgba(255, 255, 255, .12); border-radius: 12px;
    background: rgba(20, 4, 29, .72); backdrop-filter: blur(8px); color: var(--text); text-align: left;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .45); transition: transform .15s, border-color .15s;
}
.room:hover { transform: translate(-50%, -50%) scale(1.05); border-color: var(--p); }
.room__ic { font-size: 18px; color: var(--p); }
.room__lbl { display: block; font-size: 12.5px; font-weight: 600; }
.room__sub { display: block; font-size: 10px; color: var(--text-2); font-family: var(--f-mono); }
.hub__status {
    position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px;
    padding: 10px 20px; border: 1px solid var(--border); border-radius: 14px; background: rgba(10, 2, 16, .8); backdrop-filter: blur(10px);
}
.hub__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 12px var(--ok); }
.hub__title { font-family: var(--f-display); font-weight: 700; font-size: 15px; }
.hub__sub { font-size: 11.5px; color: var(--ok); }
.hub__hint { position: absolute; left: 0; right: 0; bottom: 12px; text-align: center; font-family: var(--f-mono); font-size: 10.5px; color: var(--muted); }

/* ═══ ПАНЕЛИ ═══ */
.panels { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 640px) { .panels { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1000px) { .panels { grid-template-columns: 1.4fr 1fr 1fr; } }
.projs { grid-column: 1 / -1; }
@media (min-width: 1000px) { .projs { grid-column: span 1; } }
.pempty { padding: 20px; text-align: center; font-size: 13px; }
.prow { display: flex; align-items: center; gap: 12px; padding: 10px 0; color: inherit; }
.prow + .prow { border-top: 1px solid var(--border); }
.prow__cover { width: 46px; height: 46px; flex: none; border-radius: 10px; background: var(--surf-2) center / cover no-repeat; }
.prow__i { flex: 1; min-width: 0; }
.prow__name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prow__sub { font-size: 11px; }
.pbar { height: 5px; margin-top: 6px; border-radius: 3px; background: rgba(255, 255, 255, .08); overflow: hidden; }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--p), var(--p-hov)); }
.prow__pct { font-family: var(--f-mono); font-size: 12px; color: var(--text-2); }

.perf { display: flex; flex-direction: column; gap: 12px; }
.metric { position: relative; display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 8px; }
.metric__k { font-size: 12px; }
.metric__v { font-family: var(--f-display); font-weight: 800; font-size: 18px; }
.metric__d { font-family: var(--f-mono); font-size: 11px; }
.metric__spark { grid-column: 1 / -1; width: 100%; height: 30px; }

.plat { display: flex; align-items: center; gap: 16px; }
.donut { width: 108px; height: 108px; flex: none; }
.plat__legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; flex: 1; }
.plat__legend li { display: flex; align-items: center; gap: 8px; }
.plat__legend b { margin-left: auto; font-family: var(--f-mono); }
.dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }

.line { display: flex; align-items: center; gap: 11px; padding: 9px 0; }
.line + .line { border-top: 1px solid var(--border); }
.line__ic { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 9px; background: var(--surf-2); color: var(--text-2); font-size: 17px; }
.line__ic.ok { background: rgba(0, 184, 148, .16); color: var(--ok); }
.line__i { flex: 1; min-width: 0; }
.line__t { font-size: 13px; font-weight: 500; }
.line__ago { flex: none; }

/* ═══ КОММУНИКАЦИИ ═══ */
.cc__rail { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 14px; }
.voice__name { font-size: 13px; color: var(--text-2); margin-bottom: 12px; }
.wave { display: flex; align-items: center; gap: 3px; height: 46px; }
.wave span { flex: 1; height: 20%; border-radius: 3px; background: linear-gradient(180deg, var(--p), #7F77DD); animation: wv 1s ease-in-out infinite alternate; }
@keyframes wv { from { height: 12%; } to { height: 100%; } }
.voice__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; }
.voice__mem { display: flex; }
.vava { display: grid; place-items: center; width: 30px; height: 30px; margin-left: -8px; border-radius: 50%; background: var(--surf-2); border: 2px solid var(--surf); color: var(--text-2); font-family: var(--f-mono); font-size: 10px; }
.vava:first-child { margin-left: 0; }
.vava--n { background: var(--p); color: #fff; }
.voice__leave { width: 42px; height: 42px; border: none; border-radius: 12px; background: var(--err); color: #fff; display: grid; place-items: center; }
.voice__leave .material-icons { font-size: 19px; }
.voice__leave.off { background: var(--ok); }

.chat__list { display: flex; flex-direction: column; gap: 12px; max-height: 260px; overflow-y: auto; margin-bottom: 12px; }
.cmsg { display: flex; gap: 9px; }
.cmsg__ava { display: grid; place-items: center; width: 28px; height: 28px; flex: none; border-radius: 50%; background: var(--surf-2); color: var(--text-2); font-family: var(--f-mono); font-size: 10px; }
.cmsg__top { display: flex; align-items: baseline; gap: 8px; }
.cmsg__top b { font-size: 12.5px; }
.cmsg__i p { margin: 2px 0 0; font-size: 13px; line-height: 1.4; }
.chat__bar { display: flex; gap: 8px; }
.chat__bar input { flex: 1; min-width: 0; min-height: 40px; padding: 0 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 11px; color: var(--text); font: inherit; font-size: 13.5px; }
.chat__bar input:focus { outline: none; border-color: var(--p); }
.chat__bar button { width: 42px; flex: none; border: none; border-radius: 11px; background: var(--p); color: #fff; display: grid; place-items: center; }
.chat__bar .material-icons { font-size: 18px; }
</style>
