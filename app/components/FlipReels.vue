<script setup lang="ts">
/**
 * Полноэкранное листание ленты как Reels (порт flip.js из StayInspired).
 * Вертикальный снап по одному посту: колесо / свайп / стрелки, резинка на краях,
 * двойной тап — отклик с анимацией сердца, хаптика. Esc или «✕» — выход.
 */

interface FeedMedia { type: 'image' | 'video'; label: string }
interface FeedReply { author: string; handle: string; ago: string; body: string }
interface FeedPost {
    id: string; kind: 'spark' | 'note' | 'article' | 'line' | 'thread'
    author: string; handle: string; ago: string; number?: number
    title?: string; body?: string; excerpt?: string; content?: string[]
    media?: FeedMedia; reply?: FeedReply; up: number; replies: number
}

const props = defineProps<{
    posts: FeedPost[]
    resonated: Record<string, boolean>
    bump: Record<string, number>
    startIndex?: number
}>()
const emit = defineEmits<{ close: []; resonate: [FeedPost]; open: [FeedPost] }>()

const localePath = useLocalePath()

const DRAG_START = 8
const FLIP_THRESH = 72

const index = ref(props.startIndex ?? 0)
const drag = ref(0)
const dragging = ref(false)
const heart = ref(false)

let pending = false
let startY = 0
let pointerId: number | null = null
let lock = false
let wheelAcc = 0
let tapAt = 0
let heartT: any = null

const viewport = ref<HTMLElement | null>(null)

function upCount(p: FeedPost) { return p.up + (props.bump[p.id] || 0) }
function initials(n: string) { return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }

const trackStyle = computed(() => ({
    transform: `translate3d(0, calc(${-index.value * 100}dvh + ${drag.value}px), 0)`,
    transition: dragging.value ? 'none' : 'transform .58s cubic-bezier(.2,1.32,.28,1)',
}))

function haptic(ms: number | number[]) {
    try { navigator.vibrate?.(ms) } catch { /* ignore */ }
}

function go(dir: number) {
    const i = Math.min(props.posts.length - 1, Math.max(0, index.value + dir))
    if (i === index.value) return
    index.value = i
    lock = true
    setTimeout(() => { lock = false }, 480)
    haptic(8)
}
function goTo(i: number) { index.value = Math.min(props.posts.length - 1, Math.max(0, i)) }

function like() {
    const p = props.posts[index.value]
    if (!p) return
    if (!props.resonated[p.id]) emit('resonate', p)
    clearTimeout(heartT)
    heart.value = false
    requestAnimationFrame(() => {
        heart.value = true
        haptic([12, 40, 18])
        heartT = setTimeout(() => { heart.value = false }, 800)
    })
}

function isControl(el: EventTarget | null) {
    return el instanceof Element && el.closest('.react-btn, .fr-open, a, button')
}

/* ── жесты ── */
function onWheel(e: WheelEvent) {
    e.preventDefault()
    if (lock) return
    wheelAcc += e.deltaY
    if (Math.abs(wheelAcc) > 26) { go(wheelAcc > 0 ? 1 : -1); wheelAcc = 0 }
}
function onDown(e: PointerEvent) {
    pending = true; dragging.value = false; drag.value = 0
    startY = e.clientY; pointerId = e.pointerId
}
function onMove(e: PointerEvent) {
    if (!pending && !dragging.value) return
    if (!dragging.value) {
        if (Math.abs(e.clientY - startY) < DRAG_START) return
        dragging.value = true
        try { viewport.value?.setPointerCapture(pointerId!) } catch { /* ignore */ }
    }
    let d = e.clientY - startY
    const atEdge = (d > 0 && index.value === 0) || (d < 0 && index.value === props.posts.length - 1)
    if (atEdge) d *= 0.28
    drag.value = d
}
function onUp(e: PointerEvent) {
    if (dragging.value) {
        const d = drag.value
        dragging.value = false; pending = false; drag.value = 0
        if (Math.abs(d) > FLIP_THRESH) go(d < 0 ? 1 : -1)
        return
    }
    pending = false
    if (isControl(e.target)) return
    const now = Date.now()
    if (now - tapAt < 320) { tapAt = 0; like() } else tapAt = now
}
function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') { e.preventDefault(); go(1) }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') { e.preventDefault(); go(-1) }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0) }
    else if (e.key === 'End') { e.preventDefault(); goTo(props.posts.length - 1) }
    else if (e.key === 'Escape') emit('close')
}

onMounted(() => {
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
    window.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
    clearTimeout(heartT)
})
</script>

<template>
    <Teleport to="body">
        <div class="fr">
            <!-- бар выхода -->
            <div class="fr-bar">
                <span class="fr-title">Лента · листание</span>
                <button class="fr-exit" @click="emit('close')">✕ обычная лента</button>
            </div>

            <!-- вьюпорт с треком -->
            <div ref="viewport" class="fr-viewport" @wheel.prevent="onWheel" @pointerdown="onDown"
                @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp">
                <div class="fr-track" :style="trackStyle">
                    <section v-for="(p, i) in posts" :key="p.id" class="fr-page">
                        <div class="fr-card" :class="p.kind">
                            <div class="fr-meta">
                                <span v-if="p.number" class="fr-num">{{ p.number }}</span>
                                <span v-if="p.kind === 'article'" class="fr-kind">✦ Статья</span>
                                <NuxtLink :to="localePath(`/u/${p.handle.replace('@', '')}`)" class="fr-author"
                                    @pointerdown.stop>
                                    <span class="fr-av">{{ initials(p.author) }}</span>
                                    <span>
                                        <b>{{ p.author }}</b>
                                        <span class="fr-handle">{{ p.handle }} · {{ p.ago }}</span>
                                    </span>
                                </NuxtLink>
                            </div>

                            <template v-if="p.kind === 'article'">
                                <h1 class="fr-title-txt">{{ p.title }}</h1>
                                <p class="fr-excerpt">{{ p.excerpt }}</p>
                            </template>
                            <p v-else class="fr-body" :class="p.kind">{{ p.body }}</p>

                            <div v-if="p.media" class="fr-media" :class="p.media.type">
                                <span class="fr-media-lbl">{{ p.media.label }}</span>
                                <span v-if="p.media.type === 'video'" class="fr-play">▶</span>
                            </div>

                            <div v-if="p.reply" class="fr-reply">
                                <b>{{ p.reply.author }}</b> <span class="fr-handle">{{ p.reply.handle }}</span>
                                <p>{{ p.reply.body }}</p>
                            </div>

                            <!-- сердце-вспышка -->
                            <div v-if="heart && i === index" class="fr-heart">✶</div>
                        </div>

                        <!-- правая колонка действий -->
                        <div class="fr-actions">
                            <button class="fr-act" :class="{ on: resonated[p.id] }" @click="emit('resonate', p)">
                                <span class="fr-act-ic">✶</span><span class="fr-act-n">{{ upCount(p) }}</span>
                            </button>
                            <button class="fr-act fr-open" @click="emit('open', p)">
                                <span class="fr-act-ic">↳</span><span class="fr-act-n">{{ p.replies }}</span>
                            </button>
                            <NuxtLink :to="localePath(`/p/${p.id}`)" class="fr-act" @pointerdown.stop>
                                <span class="fr-act-ic">⤴</span>
                            </NuxtLink>
                        </div>
                    </section>
                </div>
            </div>

            <!-- прогресс -->
            <div class="fr-dots">
                <span v-for="(p, i) in posts" :key="p.id" class="fr-dot" :class="{ on: i === index }" />
            </div>

            <!-- подсказка -->
            <div class="fr-hint">
                <span class="fr-k">↑</span><span class="fr-k">↓</span> листайте · двойной тап — отклик
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.fr {
    position: fixed;
    inset: 0;
    z-index: 250;
    background: var(--bg);
    overscroll-behavior: none;
    touch-action: none;
}

.fr-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: calc(12px + env(safe-area-inset-top)) 18px 12px;
    background: linear-gradient(180deg, rgba(20, 4, 29, .92), transparent);
}
.fr-title { font-family: var(--f-mono); font-size: 12px; color: var(--text-2); }
.fr-exit {
    padding: 7px 14px; border: 1px solid var(--border); border-radius: 99px;
    background: rgba(20, 4, 29, .5); color: var(--text); font-size: 12.5px; font-weight: 600;
}
.fr-exit:hover { border-color: var(--p); }

.fr-viewport { position: absolute; inset: 0; overflow: hidden; }
.fr-track { will-change: transform; }

.fr-page {
    position: relative;
    height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 64px;
    align-items: center;
    gap: 8px;
    padding: 0 clamp(18px, 6vw, 80px);
}

.fr-card {
    position: relative;
    max-width: 620px;
    margin: 0 auto;
    width: 100%;
}
.fr-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
.fr-num {
    display: grid; place-items: center; width: 30px; height: 30px; flex: none;
    border: 2px solid var(--p); border-radius: 50%; color: var(--p);
    font-family: var(--f-mono); font-weight: 700;
}
.fr-kind {
    font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--p);
}
.fr-author { display: flex; align-items: center; gap: 10px; color: var(--text); }
.fr-av {
    display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 50%;
    background: var(--p); color: #fff; font-family: var(--f-mono); font-size: 13px; font-weight: 600;
}
.fr-author b { display: block; font-size: 15px; }
.fr-handle { font-family: var(--f-mono); font-size: 12px; color: var(--muted); }

.fr-body {
    font-family: var(--f-display);
    font-size: clamp(24px, 4.4vw, 40px);
    line-height: 1.32;
    letter-spacing: -0.01em;
}
.fr-body.line { font-weight: 800; }
.fr-body.note { font-family: var(--f-body); font-size: clamp(20px, 3.4vw, 30px); line-height: 1.45; }
.fr-title-txt { font-size: clamp(28px, 5vw, 46px); line-height: 1.15; }
.fr-excerpt { margin-top: 16px; font-size: clamp(15px, 2vw, 18px); color: var(--text-2); line-height: 1.6; }

.fr-media {
    position: relative; margin-top: 22px; width: 100%; aspect-ratio: 16/9; border-radius: var(--r);
    display: grid; place-items: center; overflow: hidden;
}
.fr-media.image { background: var(--surf-2); border: 1px solid var(--border); }
.fr-media.video { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); }
.fr-media-lbl {
    font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted);
}
.fr-play {
    position: absolute; inset: 0; margin: auto; width: 58px; height: 58px; display: grid; place-items: center;
    border-radius: 50%; background: rgba(0, 0, 0, .5); color: #fff; font-size: 20px;
}
.fr-reply {
    margin-top: 20px; padding: 12px 14px; border-left: 2px solid var(--p);
    background: rgba(255, 255, 255, .04); border-radius: 0 var(--r-sm) var(--r-sm) 0; font-size: 14px;
}
.fr-reply p { margin: 4px 0 0; }

.fr-heart {
    position: absolute; inset: 0; margin: auto; width: 120px; height: 120px;
    display: grid; place-items: center; color: var(--p); font-size: 90px;
    pointer-events: none; animation: heart .8s ease forwards;
}
@keyframes heart {
    0% { opacity: 0; transform: scale(.4); }
    22% { opacity: 1; transform: scale(1.15); }
    46% { transform: scale(.95); }
    72% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.25); }
}

.fr-actions { display: flex; flex-direction: column; gap: 18px; align-items: center; }
.fr-act {
    display: grid; place-items: center; gap: 3px; width: 52px;
    background: none; border: none; color: var(--text); cursor: pointer;
}
.fr-act-ic {
    display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%;
    background: rgba(255, 255, 255, .07); font-size: 20px; transition: background .15s, color .15s;
}
.fr-act:hover .fr-act-ic { background: rgba(255, 255, 255, .14); }
.fr-act.on .fr-act-ic { background: color-mix(in srgb, var(--p) 30%, transparent); color: var(--p); }
.fr-act-n { font-family: var(--f-mono); font-size: 11px; color: var(--text-2); }

.fr-dots {
    position: absolute; top: 50%; left: 8px; transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 6px; z-index: 5;
}
.fr-dot { width: 4px; height: 12px; border-radius: 2px; background: var(--border); transition: background .3s, height .3s; }
.fr-dot.on { background: var(--p); height: 22px; }

.fr-hint {
    position: absolute; bottom: calc(18px + env(safe-area-inset-bottom)); left: 0; right: 0; z-index: 5;
    text-align: center; font-family: var(--f-mono); font-size: 11px; color: var(--muted);
}
.fr-k {
    display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px;
    margin: 0 2px; border: 1px solid var(--border); border-radius: 5px; color: var(--text-2);
}

@media (max-width: 640px) {
    .fr-page { grid-template-columns: minmax(0, 1fr) 56px; padding: 0 16px; }
    .fr-actions { gap: 14px; }
    .fr-dots { display: none; }
}
</style>
