<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)

/* ── фон: плавающая сетка из реальных обложек/скриншотов игр ── */
const GRID = 36
const imgs = ref<string[]>([])

onMounted(async () => {
    try {
        const r = await $fetch<{ games: any[] }>('/api/games', { query: { limit: 60 } })
        const pool: string[] = []
        for (const g of r?.games || []) {
            for (const s of g.screenshots || []) if (typeof s === 'string' && s.startsWith('http')) pool.push(s)
            if (typeof g.cover === 'string' && g.cover.startsWith('http')) pool.push(g.cover)
            if (typeof g.banner === 'string' && g.banner.startsWith('http')) pool.push(g.banner)
        }
        if (!pool.length) return
        const out: string[] = []
        for (let i = 0; i < GRID; i++) out.push(pool[i % pool.length]!)
        imgs.value = out.sort(() => Math.random() - 0.5)
    } catch { /* нет БД — останутся плейсхолдеры */ }
})

// пока грузится / нет игр — пустые ячейки (тематический фон)
const cells = computed(() => imgs.value.length ? imgs.value : Array.from({ length: GRID }, () => ''))

function goHome() { clearError({ redirect: '/' }) }
function back() { if (import.meta.client) history.back() }
</script>

<template>
    <div class="err">
        <div class="err__scene" aria-hidden="true">
            <div class="err__grid">
                <div v-for="(src, i) in cells" :key="i" class="err__card">
                    <img v-if="src" :src="src" alt="" loading="lazy" @error="$event.target.style.display = 'none'">
                </div>
            </div>
            <div class="err__shade" />
            <div class="err__glow" />
        </div>

        <div class="err__center">
            <div class="err__box">
                <div class="err__big">{{ error?.statusCode || 404 }}</div>
                <h1 class="err__title">{{ is404 ? $t('error.title404') : $t('error.title500') }}</h1>
                <p class="err__text">{{ is404 ? $t('error.text404') : $t('error.text500') }}</p>
                <div class="err__cta">
                    <button class="btn btn--primary" @click="goHome">{{ $t('error.home') }}</button>
                    <NuxtLink to="/games" class="btn" @click="clearError()">{{ $t('error.browse') }}</NuxtLink>
                </div>
            </div>
        </div>

        <button class="err__close" aria-label="Назад" @click="back">✕</button>
    </div>
</template>

<style scoped>
.err {
    position: relative;
    min-height: 100dvh;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    font-family: var(--f-body);
}

/* ── сцена с плавающей сеткой ── */
.err__scene {
    position: fixed;
    inset: 0;
    overflow: hidden;
    perspective: 1100px;
    background: var(--bg);
}

.err__grid {
    position: absolute;
    width: 150vw;
    height: 150vh;
    left: -25vw;
    top: -25vh;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: 155px;
    gap: 14px;
    transform-style: preserve-3d;
    transform: rotateZ(-7deg) rotateY(-18deg) scale(1.15);
    animation: floatGrid 52s ease-in-out infinite alternate;
    filter: blur(4px);
    opacity: .7;
}

.err__card {
    overflow: hidden;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--surf-2), var(--surf));
    box-shadow: 0 8px 24px rgba(0, 0, 0, .5);
}

.err__card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* магента-затемнение поверх сетки (вместо синего Steam) */
.err__shade {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(ellipse at center, rgba(20, 4, 29, .32) 0%, rgba(20, 4, 29, .70) 66%, rgba(10, 2, 16, .92) 100%),
        linear-gradient(90deg, rgba(20, 4, 29, .58), rgba(20, 4, 29, .12) 50%, rgba(20, 4, 29, .62));
}

.err__glow {
    position: absolute;
    top: 42%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    height: 380px;
    background: var(--p);
    filter: blur(130px);
    opacity: .28;
    pointer-events: none;
}

/* ── центр ── */
.err__center {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30px;
}

.err__box {
    transform: translateY(-2vh);
    text-shadow: 0 3px 24px rgba(0, 0, 0, .7);
}

.err__big {
    font-family: var(--f-display);
    font-weight: 800;
    font-size: clamp(100px, 17vw, 200px);
    line-height: .82;
    letter-spacing: -6px;
    background: linear-gradient(180deg, #fff 40%, var(--p) 130%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 6px 30px rgba(195, 33, 120, .45));
}

.err__title {
    margin: 22px 0 0;
    font-family: var(--f-brand);
    font-size: clamp(22px, 3.4vw, 38px);
    font-weight: 400;
    line-height: 1.1;
}

.err__text {
    margin: 14px auto 0;
    max-width: 500px;
    color: var(--text-2);
    font-size: 15.5px;
    line-height: 1.55;
}

.err__cta {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 28px;
}

.err__close {
    position: fixed;
    right: 18px;
    top: 14px;
    z-index: 10;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(20, 4, 29, .5);
    backdrop-filter: blur(8px);
    color: var(--muted);
    font-size: 16px;
    cursor: pointer;
    transition: color .15s, border-color .15s;
}

.err__close:hover {
    color: #fff;
    border-color: var(--p);
}

@keyframes floatGrid {
    0% { transform: translate3d(-2.2vw, -1.5vh, 0) rotateZ(-7deg) rotateY(-18deg) scale(1.15); }
    50% { transform: translate3d(1.8vw, 1.2vh, 18px) rotateZ(-7.2deg) rotateY(-17.4deg) scale(1.155); }
    100% { transform: translate3d(-1vw, 2.4vh, 0) rotateZ(-6.7deg) rotateY(-18.4deg) scale(1.15); }
}

@media (max-width: 800px) {
    .err__grid {
        width: 190vw;
        left: -45vw;
        grid-template-columns: repeat(5, 1fr);
        grid-auto-rows: 125px;
        gap: 10px;
        transform: rotateZ(-7deg) rotateY(-14deg) scale(1.2);
    }
    .err__big { letter-spacing: -4px; }
}

@media (prefers-reduced-motion: reduce) {
    .err__grid { animation: none; }
}
</style>
