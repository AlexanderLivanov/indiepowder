<script setup lang="ts">
export interface Provider {
    id: string
    name: string
    mark: string      // монограмма — позже меняется на настоящий SVG-логотип
    color: string     // фирменный цвет
    ink?: string      // цвет текста поверх фирменного
}

const props = defineProps<{ providers: Provider[] }>()
const emit = defineEmits<{ select: [Provider] }>()

const cur = ref(0)
const N = computed(() => props.providers.length)

/** позиция карточки относительно центра: 0 — по центру, ±1 — соседи */
function offset(i: number) {
    let off = i - cur.value
    if (off > N.value / 2) off -= N.value
    if (off < -N.value / 2) off += N.value
    return Math.max(-4, Math.min(4, off))
}

function go(idx: number) {
    cur.value = ((idx % N.value) + N.value) % N.value
}

function pick(i: number) {
    if (i === cur.value) emit('select', props.providers[i]!)
    else go(i)
}

/* --- свайп пальцем и мышкой --- */
let startX: number | null = null
let moved = false

function down(x: number) { startX = x; moved = false }
function movePtr(x: number) { if (startX !== null && Math.abs(x - startX) > 5) moved = true }
function up(x: number) {
    if (startX !== null && Math.abs(x - startX) >= 50) go(cur.value + (x - startX < 0 ? 1 : -1))
    startX = null
}

/* --- колесо мыши --- */
let wheelTimer: ReturnType<typeof setTimeout> | undefined
function onWheel(e: WheelEvent) {
    e.preventDefault()
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => go(cur.value + (e.deltaY > 0 || e.deltaX > 0 ? 1 : -1)), 30)
}

const current = computed(() => props.providers[cur.value]!)
</script>

<template>
    <div class="pcar">
        <button class="pcar__nav prev" :aria-label="$t('auth.prev')" @click="go(cur - 1)">‹</button>

        <div class="pcar__stage" @wheel="onWheel" @mousedown="down($event.clientX)" @mousemove="movePtr($event.clientX)"
            @mouseup="up($event.clientX)" @mouseleave="startX = null"
            @touchstart.passive="down($event.touches[0]!.clientX)"
            @touchmove.passive="movePtr($event.touches[0]!.clientX)" @touchend="up($event.changedTouches[0]!.clientX)"
            @keydown.left.prevent="go(cur - 1)" @keydown.right.prevent="go(cur + 1)"
            @keydown.enter.prevent="emit('select', current)" tabindex="0" role="listbox"
            :aria-label="$t('auth.chooseService')">
            <div v-for="(p, i) in providers" :key="p.id" class="pcar__item" :data-position="offset(i)" role="option"
                :aria-selected="i === cur" @click="moved ? null : pick(i)">
                <div class="pcard" :style="{ '--brand': p.color, '--ink': p.ink || '#fff' }">
                    <span class="pcard__mark">{{ p.mark }}</span>
                    <span class="pcard__name">{{ p.name }}</span>
                </div>
            </div>
        </div>

        <button class="pcar__nav next" :aria-label="$t('auth.next')" @click="go(cur + 1)">›</button>

        <!-- точки -->
        <div class="pcar__dots">
            <button v-for="(p, i) in providers" :key="p.id" class="pcar__dot" :class="{ 'is-on': i === cur }"
                :aria-label="p.name" @click="go(i)" />
        </div>
    </div>
</template>

<style scoped>
.pcar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 210px;
    margin: 10px 0 0;
}

.pcar__stage {
    position: relative;
    width: 100%;
    height: 190px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    outline: none;
    overflow: visible;
}

.pcar__stage:focus-visible {
    outline: 2px solid var(--p);
    outline-offset: 6px;
    border-radius: 12px;
}

.pcar__stage:active {
    cursor: grabbing;
}

/* ---- позиционирование карточек (из player.css) ---- */
.pcar__item {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 120px;
    height: 140px;
    transition: all .5s ease;
    transform: translate(-50%, -50%) scale(.5);
    opacity: .5;
    filter: blur(2px);
    z-index: 1;
    user-select: none;
}

.pcar__item[data-position="0"] {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -50%) scale(1.1);
    z-index: 10;
}

.pcar__item[data-position="-1"] {
    transform: translate(calc(-50% - 92px), -50%) scale(.86);
    opacity: .9;
    filter: blur(.4px);
    z-index: 5;
}

.pcar__item[data-position="1"] {
    transform: translate(calc(-50% + 92px), -50%) scale(.86);
    opacity: .9;
    filter: blur(.4px);
    z-index: 5;
}

.pcar__item[data-position="-2"] {
    transform: translate(calc(-50% - 160px), -50%) scale(.66);
    opacity: .65;
    filter: blur(1px);
    z-index: 3;
}

.pcar__item[data-position="2"] {
    transform: translate(calc(-50% + 160px), -50%) scale(.66);
    opacity: .65;
    filter: blur(1px);
    z-index: 3;
}

.pcar__item[data-position="-3"],
.pcar__item[data-position="-4"] {
    transform: translate(calc(-50% - 210px), -50%) scale(.5);
    opacity: .35;
    z-index: 1;
}

.pcar__item[data-position="3"],
.pcar__item[data-position="4"] {
    transform: translate(calc(-50% + 210px), -50%) scale(.5);
    opacity: .35;
    z-index: 1;
}

/* ---- сама карточка сервиса ---- */
.pcard {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 16px;
    background: rgba(20, 4, 29, .9);
    border: 1px solid rgba(255, 255, 255, .15);
    box-shadow: 0 15px 35px rgba(0, 0, 0, .7);
    cursor: pointer;
}

.pcar__item[data-position="0"] .pcard {
    border-color: var(--brand);
    box-shadow: 0 15px 40px rgba(0, 0, 0, .7), 0 0 0 1px var(--brand), 0 0 26px -6px var(--brand);
}

.pcard__mark {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: var(--brand);
    color: var(--ink);
    font-family: var(--f-mono);
    font-weight: 700;
    font-size: 19px;
    letter-spacing: -.5px;
}

.pcard__name {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 13px;
    color: #fff;
    text-align: center;
    padding: 0 6px;
}

/* ---- стрелки ---- */
.pcar__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: var(--tap);
    height: var(--tap);
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #fff;
    font-size: 26px;
    line-height: 1;
    z-index: 20;
    transition: .2s;
}

.pcar__nav:hover {
    background: var(--p);
}

.pcar__nav.prev {
    left: -6px;
}

.pcar__nav.next {
    right: -6px;
}

/* ---- точки ---- */
.pcar__dots {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
}

.pcar__dot {
    width: 6px;
    height: 6px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--border);
}

.pcar__dot.is-on {
    background: var(--p);
    width: 16px;
    border-radius: 3px;
}

@media (prefers-reduced-motion: reduce) {
    .pcar__item {
        transition: none;
    }
}
</style>