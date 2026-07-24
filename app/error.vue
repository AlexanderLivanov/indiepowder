<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)

// на 404 подсовываем случайные игры — пусть ошибка тоже работает на выдачу
const suggestions = dailyRotation(4, 20260724)

function goHome() { clearError({ redirect: '/' }) }
</script>

<template>
    <div class="err">
        <div class="err__glow" aria-hidden="true" />

        <div class="wrap err__in">
            <p class="err__code">{{ error?.statusCode || 500 }}</p>

            <!-- «сломанный» пиксель-арт -->
            <div class="pix" aria-hidden="true">
                <span v-for="i in 24" :key="i" class="pix__b" :style="{ '--i': i }" />
            </div>

            <h1 class="err__title">{{ is404 ? $t('error.title404') : $t('error.title500') }}</h1>
            <p class="err__text muted">{{ is404 ? $t('error.text404') : $t('error.text500') }}</p>

            <div class="err__cta">
                <button class="btn btn--primary" @click="goHome">{{ $t('error.home') }}</button>
                <NuxtLink to="/games" class="btn" @click="clearError()">{{ $t('error.browse') }}</NuxtLink>
            </div>

            <section v-if="is404" class="err__sug">
                <p class="err__sugh">{{ $t('error.instead') }}</p>
                <div class="err__grid">
                    <NuxtLink v-for="g in suggestions" :key="g.id" :to="`/games/${g.id}`" class="sg"
                        @click="clearError()">
                        <span class="sg__cover" :style="{ background: g.cover }" />
                        <b>{{ g.title }}</b>
                        <span class="muted">{{ $t('game.by') }} {{ g.author }}</span>
                    </NuxtLink>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.err {
    position: relative;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: var(--bg);
    color: var(--text);
    font-family: var(--f-body);
    overflow: hidden;
    padding-block: 60px;
}

.err__glow {
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 460px;
    height: 340px;
    background: var(--p);
    filter: blur(110px);
    opacity: .3;
}

.err__in {
    position: relative;
    text-align: center;
}

.err__code {
    margin: 0;
    font-family: var(--f-mono);
    font-size: 13px;
    letter-spacing: 4px;
    color: var(--p);
}

/* рассыпающийся пиксельный блок */
.pix {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    width: 132px;
    margin: 20px auto 24px;
}

.pix__b {
    aspect-ratio: 1;
    background: var(--p);
    border-radius: 1px;
    animation: fall 3.4s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.17s);
}

.pix__b:nth-child(3n) {
    background: var(--violet);
}

.pix__b:nth-child(5n) {
    background: var(--surf-2);
}

@keyframes fall {

    0%,
    55% {
        transform: none;
        opacity: 1;
    }

    70% {
        transform: translateY(10px) rotate(12deg);
        opacity: .35;
    }

    85%,
    100% {
        transform: none;
        opacity: 1;
    }
}

.err__title {
    font-family: var(--f-brand);
    font-size: clamp(26px, 7vw, 46px);
    line-height: 1.1;
    margin: 0;
}

.err__text {
    margin: 14px auto 0;
    max-width: 420px;
    font-size: 14.5px;
}

.err__cta {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
}

.err__sug {
    margin-top: clamp(38px, 7vw, 60px);
}

.err__sugh {
    margin: 0 0 16px;
    font-family: var(--f-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
}

.err__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    max-width: 720px;
    margin: 0 auto;
}

.sg {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
    text-align: left;
    color: inherit;
    text-decoration: none;
}

.sg:hover {
    border-color: var(--p);
}

.sg__cover {
    height: 62px;
    border-radius: var(--r-sm);
    margin-bottom: 6px;
}

.sg b {
    font-family: var(--f-display);
    font-size: 13.5px;
}

.sg span.muted {
    font-size: 11.5px;
}

@media (min-width: 700px) {
    .err__grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
</style>