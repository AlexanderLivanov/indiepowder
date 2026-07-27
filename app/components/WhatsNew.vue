<script setup lang="ts">
import { NEWS_SLIDES } from '~/utils/whatsnew'

/**
 * Всплывающее окно «что нового».
 *
 * Мобилка — bottom-sheet, выезжает снизу.
 * Десктоп — модалка по центру.
 * Внутри — карусель слайдов с лёгким 3D: соседние карточки
 * отодвинуты вглубь и приглушены, активная — впереди.
 *
 * Управление показом — в composable useWhatsNew (cookie + версия).
 */
const { open, close } = useWhatsNew()

const index = ref(0)
const slides = NEWS_SLIDES
const last = computed(() => slides.length - 1)

function next() {
    if (index.value < last.value) index.value++
    else close()
}
function prev() { if (index.value > 0) index.value-- }
function goTo(i: number) { index.value = i }

/* ── свайп/перетаскивание ── */
const dragX = ref(0)
const dragging = ref(false)
let startX = 0

function onStart(e: TouchEvent | MouseEvent) {
    startX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    dragging.value = true
    dragX.value = 0
}
function onMove(e: TouchEvent | MouseEvent) {
    if (!dragging.value) return
    const x = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    dragX.value = x - startX
}
function onEnd() {
    if (!dragging.value) return
    dragging.value = false
    const d = dragX.value
    dragX.value = 0
    if (d < -60 && index.value < last.value) index.value++
    else if (d > 60 && index.value > 0) index.value--
}

/** позиция карточки относительно активной → 3D-трансформация */
function cardStyle(i: number) {
    const offset = i - index.value
    const drag = dragging.value ? dragX.value : 0
    const base = offset * 100
    const shift = base + (drag / 6)   // палец слегка тянет всю ленту

    // глубина: чем дальше от центра, тем меньше и глубже
    const dist = Math.abs(offset - (dragging.value ? -dragX.value / 300 : 0))
    const scale = Math.max(0.82, 1 - dist * 0.12)
    const rotY = offset * -8 + (drag / 40)   // поворот по Y — тот самый 3D
    const opacity = Math.max(0.35, 1 - dist * 0.4)

    return {
        transform: `translateX(${shift}%) scale(${scale}) rotateY(${rotY}deg)`,
        opacity,
        zIndex: 10 - Math.round(dist),
        transition: dragging.value ? 'none' : 'transform .45s cubic-bezier(.22,1,.36,1), opacity .45s',
    }
}

// клавиатура на десктопе
function onKey(e: KeyboardEvent) {
    if (!open.value) return
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// при повторном открытии — с первого слайда
watch(open, v => { if (v) index.value = 0 })
</script>

<template>
    <Teleport to="body">
        <Transition name="wn">
            <div v-if="open" class="wn" @click.self="close">
                <div class="wn__box">
                    <button class="wn__x" :aria-label="$t('nav.close')" @click="close">✕</button>

                    <!-- карусель -->
                    <div class="wn__stage" @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd"
                        @mousedown.prevent="onStart" @mousemove="onMove" @mouseup="onEnd" @mouseleave="onEnd">
                        <div class="wn__track">
                            <article v-for="(s, i) in slides" :key="s.id" class="wn__card" :style="cardStyle(i)">
                                <div class="wn__img" :style="{ background: s.accent || 'var(--surf-2)' }">
                                    <img :src="s.image" :alt="$t(s.title)" draggable="false">
                                </div>
                            </article>
                        </div>
                    </div>

                    <!-- текст активного слайда -->
                    <Transition name="wn-text" mode="out-in">
                        <div :key="index" class="wn__meta">
                            <h2>{{ $t(slides[index]!.title) }}</h2>
                            <p>{{ $t(slides[index]!.text) }}</p>
                        </div>
                    </Transition>

                    <!-- точки -->
                    <div class="wn__dots">
                        <button v-for="(s, i) in slides" :key="s.id" class="dot" :class="{ 'is-on': i === index }"
                            :aria-label="`${i + 1}`" @click="goTo(i)" />
                    </div>

                    <!-- кнопка -->
                    <button class="btn btn--primary wn__cta" @click="next">
                        {{ index === last ? $t('news.done') : $t('news.next') }}
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.wn {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    background: rgba(0, 0, 0, .6);
    backdrop-filter: blur(6px);
}

.wn__box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    width: 100%;
    padding: 30px 20px calc(24px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, var(--surf-2), var(--surf));
    border: 1px solid rgba(195, 33, 120, .28);
}

.wn__x {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 5;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, .3);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-2);
}

.wn__x:hover {
    color: #fff;
}

/* сцена карусели с перспективой */
.wn__stage {
    width: 100%;
    perspective: 1400px;
    cursor: grab;
    user-select: none;
}

.wn__stage:active {
    cursor: grabbing;
}

.wn__track {
    position: relative;
    height: min(46vh, 340px);
    transform-style: preserve-3d;
}

.wn__card {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 100%;
    max-width: 440px;
    left: 0;
    right: 0;
    will-change: transform, opacity;
    transform-style: preserve-3d;
}

.wn__img {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, .6);
}

.wn__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.wn__meta {
    text-align: center;
    max-width: 440px;
}

.wn__meta h2 {
    font-size: clamp(20px, 5vw, 26px);
    margin-bottom: 8px;
}

.wn__meta p {
    font-size: 14.5px;
    line-height: 1.55;
    color: var(--text-2);
}

.wn__dots {
    display: flex;
    gap: 8px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
    border: none;
    transition: width .3s, background .3s;
}

.dot.is-on {
    width: 24px;
    border-radius: 4px;
    background: var(--p);
}

.wn__cta {
    width: 100%;
    max-width: 440px;
}

/* ─── мобилка: bottom-sheet ─── */
.wn {
    align-items: flex-end;
}

.wn__box {
    border-radius: 26px 26px 0 0;
}

.wn-enter-active,
.wn-leave-active {
    transition: opacity .35s;
}

.wn-enter-active .wn__box,
.wn-leave-active .wn__box {
    transition: transform .4s cubic-bezier(.22, 1, .36, 1);
}

.wn-enter-from,
.wn-leave-to {
    opacity: 0;
}

.wn-enter-from .wn__box,
.wn-leave-to .wn__box {
    transform: translateY(100%);
}

/* смена текста */
.wn-text-enter-active,
.wn-text-leave-active {
    transition: opacity .25s, transform .25s;
}

.wn-text-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.wn-text-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* ─── десктоп: модалка по центру ─── */
@media (min-width: 760px) {
    .wn {
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .wn__box {
        width: min(560px, 100%);
        border-radius: 24px;
        padding: 36px 32px 32px;
    }

    /* на десктопе выезд снизу заменяем на всплытие */
    .wn-enter-from .wn__box,
    .wn-leave-to .wn__box {
        transform: translateY(24px) scale(.96);
    }
}

@media (prefers-reduced-motion: reduce) {
    .wn__card {
        transition: none !important;
    }
}
</style>