<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'

const props = defineProps<{ game: Game }>()

const localePath = useLocalePath()
const { t } = useI18n()
const { style, move, leave: tiltLeave } = useTilt()

const priceLabel = computed(() =>
    props.game.price === 0 ? t('game.free') : `${props.game.price.toLocaleString('ru-RU')} ₽`,
)

/* ---------- раскрытие по задержке курсора (только десктоп) ---------- */
const DWELL = 480          // сколько держать курсор, мс
const root = ref<HTMLElement | null>(null)
const expanded = ref(false)
const align = ref<'left' | 'center' | 'right'>('center')
const shot = ref(0)

let dwellTimer: ReturnType<typeof setTimeout> | undefined
let shotTimer: ReturnType<typeof setInterval> | undefined

function canExpand() {
    return import.meta.client
        && window.matchMedia('(hover: hover) and (min-width: 1000px)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function enter() {
    if (!canExpand()) return
    clearTimeout(dwellTimer)
    dwellTimer = setTimeout(open, DWELL)
}

function open() {
    const el = root.value
    if (!el) return
    // не даём раскрытой карточке вылезти за экран
    const r = el.getBoundingClientRect()
    const grow = 210
    if (r.left - grow / 2 < 16) align.value = 'left'
    else if (r.right + grow / 2 > window.innerWidth - 16) align.value = 'right'
    else align.value = 'center'

    expanded.value = true
    shot.value = 0
    clearInterval(shotTimer)
    shotTimer = setInterval(() => {
        shot.value = (shot.value + 1) % props.game.shots.length
    }, 1400)
}

function close() {
    clearTimeout(dwellTimer)
    clearInterval(shotTimer)
    expanded.value = false
    tiltLeave()
}

function onMove(e: MouseEvent) {
    if (!expanded.value) move(e)   // пока не раскрыто — наклоняем
}

onUnmounted(() => { clearTimeout(dwellTimer); clearInterval(shotTimer) })
</script>

<template>
    <div ref="root" class="slot" :class="{ 'is-expanded': expanded, [`al-${align}`]: expanded }">
        <NuxtLink :to="localePath(`/games/${game.id}`)" class="gcard" :style="expanded ? undefined : style"
            @mousemove="onMove" @mouseenter="enter" @mouseleave="close">
            <!-- обложка / слайдшоу скриншотов -->
            <div class="gcard__img">
                <div v-for="(s, i) in game.shots" :key="i" class="gcard__shot" v-lazybg="s"
                    :style="{ opacity: expanded ? (i === shot ? 1 : 0) : (i === 0 ? 1 : 0) }" />
                <span class="gcard__rating">★ {{ game.rating.toFixed(1) }}</span>
                <span v-if="game.web" class="gcard__web">web</span>

                <!-- индикаторы скриншотов -->
                <div v-if="expanded" class="gcard__dots">
                    <span v-for="(s, i) in game.shots" :key="i" :class="{ 'is-on': i === shot }" />
                </div>
            </div>

            <!-- всегда видимая подпись -->
            <div class="gcard__main">
                <div class="gcard__info">
                    <h3 class="gcard__title">{{ game.title }}</h3>
                    <span class="gcard__price" :class="{ 'is-free': game.price === 0 }">{{ priceLabel }}</span>
                </div>
                <p class="gcard__by">{{ $t('game.by') }} {{ game.author }}</p>

                <!-- появляется только при раскрытии -->
                <p class="gcard__desc">{{ game.desc }}</p>
            </div>

            <!-- боковая панель — только при раскрытии -->
            <aside class="gcard__side">
                <dl class="specs">
                    <div>
                        <dt>{{ $t('game.platform') }}</dt>
                        <dd>{{ game.engine }}</dd>
                    </div>
                    <div>
                        <dt>{{ $t('game.plays') }}</dt>
                        <dd>{{ fmtPlays(game.plays) }}</dd>
                    </div>
                    <div>
                        <dt>{{ $t('game.rating') }}</dt>
                        <dd>★ {{ game.rating.toFixed(1) }}</dd>
                    </div>
                </dl>
                <div class="chips">
                    <span v-for="tg in game.tags" :key="tg" class="tag">{{ tg }}</span>
                </div>
                <span class="side-cta">{{ game.web ? $t('game.playNow') : $t('game.open') }} →</span>
            </aside>
        </NuxtLink>
    </div>
</template>

<style scoped>
/* слот держит место в сетке, карточка внутри может расти поверх */
.slot {
    position: relative;
}

.slot.is-expanded {
    z-index: 40;
}

.gcard {
    position: relative;
    display: grid;
    grid-template-areas: 'img' 'main';
    grid-template-columns: 1fr;
    border-radius: 20px;
    overflow: hidden;
    background: #00000030;
    box-shadow: 0 1px 20px 0 #ffffff0a;
    transform-style: preserve-3d;
    will-change: transform;
}

/* светящаяся рамка */
.gcard::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    background: linear-gradient(to top, rgba(255, 255, 255, .1) 20%, rgba(255, 255, 0, 0) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 10;
}

/* блик за курсором */
.gcard::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, .1) 20%, rgba(255, 255, 255, .5) 40%, rgba(255, 255, 255, .1) 60%, transparent 80%);
    background-size: 200% 100%;
    background-position: calc(50% + var(--dx, 0%)) 0;
    opacity: 0;
    transition: opacity .2s;
    pointer-events: none;
    mix-blend-mode: overlay;
    z-index: 2;
}

@media (hover: hover) {
    .gcard:hover::after {
        opacity: 1
    }

    .gcard:hover {
        box-shadow: 0 15px 30px rgba(0, 0, 0, .3)
    }
}

/* ---- обложка ---- */
.gcard__img {
    grid-area: img;
    position: relative;
    height: 110px;
    border-radius: 20px 20px 0 0;
    margin: 5px 5px 0;
    overflow: hidden;
}

.gcard__shot {
    position: absolute;
    inset: 0;
    background: var(--surf-2);
    /* плейсхолдер до ленивой загрузки */
    background-size: cover;
    background-position: center;
    transition: opacity .55s ease;
}

.gcard__rating {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 3px 9px;
    border-radius: 20px;
    background: rgba(0, 0, 0, .55);
    font-family: var(--f-mono);
    font-size: 11px;
    color: #ffc107;
}

.gcard__web {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 3px 8px;
    border-radius: 20px;
    background: rgba(0, 0, 0, .55);
    font-family: var(--f-mono);
    font-size: 10px;
    color: #2ecc71;
}

.gcard__dots {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
}

.gcard__dots span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .35);
    transition: all .3s;
}

.gcard__dots span.is-on {
    background: #fff;
    width: 14px;
    border-radius: 3px
}

/* ---- подпись ---- */
.gcard__main {
    grid-area: main;
    padding: 10px 12px 12px;
    min-width: 0;
}

.gcard__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.gcard__title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: .95rem;
    font-weight: 300;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gcard__price {
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: 20px;
    font-family: var(--f-mono);
    font-size: .8rem;
    font-weight: 700;
    color: var(--warn);
    white-space: nowrap;
}

.gcard__price.is-free {
    color: #2ecc71
}

.gcard__by {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: rgba(255, 255, 255, .5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* скрыто, пока карточка не раскрыта */
.gcard__desc,
.gcard__side {
    display: none
}

@media (min-width: 640px) {
    .gcard__img {
        height: 150px
    }

    .gcard__title {
        font-size: 1.05rem
    }
}

/* ============ РАСКРЫТОЕ СОСТОЯНИЕ (только десктоп) ============ */
@media (hover: hover) and (min-width: 1000px) {
    .slot.is-expanded .gcard {
        position: absolute;
        top: -14px;
        width: calc(100% + 210px);
        grid-template-areas: 'img side' 'main side';
        grid-template-columns: 1fr 190px;
        background: var(--surf);
        box-shadow: 0 24px 60px rgba(0, 0, 0, .6);
        animation: cardOpen .28s cubic-bezier(.2, .7, .2, 1);
        z-index: 40;
    }

    .slot.al-center.is-expanded .gcard {
        left: 50%;
        transform: translateX(-50%)
    }

    .slot.al-left.is-expanded .gcard {
        left: 0
    }

    .slot.al-right.is-expanded .gcard {
        right: 0
    }

    @keyframes cardOpen {
        from {
            opacity: .6;
            transform: scale(.97) translateX(var(--tx, 0))
        }
    }

    .slot.al-center.is-expanded .gcard {
        --tx: -50%
    }

    .slot.is-expanded .gcard__img {
        height: 190px
    }

    .slot.is-expanded .gcard__desc {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 9px 0 0;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--text-2);
    }

    .slot.is-expanded .gcard__side {
        grid-area: side;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px 14px 14px 0;
        margin-left: 2px;
        border-left: 1px solid var(--border);
        padding-left: 14px;
        margin-top: 5px;
    }

    .specs {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 9px
    }

    .specs dt {
        font-family: var(--f-mono);
        font-size: 10px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: .4px
    }

    .specs dd {
        margin: 2px 0 0;
        font-size: 13px;
        font-weight: 600;
        color: #fff
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px
    }

    .side-cta {
        margin-top: auto;
        font-family: var(--f-display);
        font-weight: 700;
        font-size: 13px;
        color: var(--p);
    }
}

@media (prefers-reduced-motion: reduce) {
    .gcard {
        transform: none !important
    }
}
</style>