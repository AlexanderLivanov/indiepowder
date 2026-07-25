<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

/* ── как работает комиссия: интерактивный ползунок ── */
const jamBorn = ref(true)   // игра родилась на джеме Dustore?
const price = ref(500)
const commission = computed(() => jamBorn.value ? 0 : 10)
const youGet = computed(() => Math.round(price.value * (1 - commission.value / 100)))

const features = [
    { icon: '◈', key: 'commission' },
    { icon: '▦', key: 'upload' },
    { icon: '✦', key: 'recommend' },
    { icon: '◆', key: 'expert' },
    { icon: '✎', key: 'reviews' },
    { icon: '▣', key: 'bugs' },
]

const steps = ['signup', 'studio', 'upload', 'publish']

useSeoMeta({
    title: () => `${t('devs.metaTitle')} — Dustore`,
    description: () => t('devs.metaDesc'),
})
</script>

<template>
    <div class="devs">
        <!-- ═══════ ГЕРОЙ + ПУБЛИКАЦИЯ ═══════ -->
        <section class="top">
            <div class="top__copy">
                <span class="kick">{{ $t('devs.kicker') }}</span>
                <h1>{{ $t('devs.title') }}</h1>
                <p class="lead">{{ $t('devs.lead') }}</p>
                <div class="top__cta">
                    <NuxtLink :to="localePath('/console')" class="btn btn--primary">{{ $t('devs.toConsole') }}
                    </NuxtLink>
                    <a href="#how" class="btn">{{ $t('devs.howItWorks') }}</a>
                </div>
            </div>

            <!-- окно быстрой публикации -->
            <div class="top__upload">
                <UploadHero />
            </div>
        </section>

        <!-- ═══════ ФИШКИ ═══════ -->
        <section class="feats">
            <h2 class="h">{{ $t('devs.featsTitle') }}</h2>
            <div class="feats__grid">
                <article v-for="f in features" :key="f.key" class="feat card">
                    <span class="feat__ic">{{ f.icon }}</span>
                    <h3>{{ $t(`devs.feat.${f.key}.t`) }}</h3>
                    <p>{{ $t(`devs.feat.${f.key}.d`) }}</p>
                </article>
            </div>
        </section>

        <!-- ═══════ КОМИССИЯ (интерактив) ═══════ -->
        <section class="comm card">
            <div class="comm__l">
                <span class="kick">{{ $t('devs.commKicker') }}</span>
                <h2>{{ $t('devs.commTitle') }}</h2>
                <p class="muted">{{ $t('devs.commText') }}</p>

                <label class="switch">
                    <input v-model="jamBorn" type="checkbox">
                    <span class="switch__track"><span class="switch__dot" /></span>
                    {{ $t('devs.commJam') }}
                </label>
            </div>

            <div class="comm__calc">
                <label class="calc__row">
                    <span>{{ $t('devs.commPrice') }}</span>
                    <input v-model.number="price" type="range" min="0" max="2000" step="50">
                    <b>{{ price.toLocaleString('ru-RU') }} ₽</b>
                </label>

                <div class="calc__out">
                    <div class="calc__cell">
                        <span>{{ $t('devs.commRate') }}</span>
                        <b :class="{ 'is-zero': commission === 0 }">{{ commission }}%</b>
                    </div>
                    <div class="calc__arrow">→</div>
                    <div class="calc__cell calc__cell--hi">
                        <span>{{ $t('devs.commYouGet') }}</span>
                        <b>{{ youGet.toLocaleString('ru-RU') }} ₽</b>
                    </div>
                </div>

                <p v-if="commission === 0" class="calc__note">{{ $t('devs.commZeroNote') }}</p>
            </div>
        </section>

        <!-- ═══════ КАК ЗАЛИТЬ ═══════ -->
        <section id="how" class="how">
            <h2 class="h">{{ $t('devs.howTitle') }}</h2>
            <ol class="how__steps">
                <li v-for="(s, i) in steps" :key="s" class="step">
                    <span class="step__n">{{ i + 1 }}</span>
                    <div>
                        <h3>{{ $t(`devs.step.${s}.t`) }}</h3>
                        <p>{{ $t(`devs.step.${s}.d`) }}</p>
                    </div>
                </li>
            </ol>
        </section>

        <!-- ═══════ ФИНАЛЬНЫЙ CTA ═══════ -->
        <section class="fin card">
            <h2>{{ $t('devs.finTitle') }}</h2>
            <p class="muted">{{ $t('devs.finText') }}</p>
            <div class="fin__cta">
                <NuxtLink :to="localePath('/console')" class="btn btn--primary">{{ $t('devs.toConsole') }}</NuxtLink>
                <NuxtLink v-if="!user" :to="localePath('/login')" class="btn">{{ $t('nav.login') }}</NuxtLink>
            </div>
        </section>
    </div>
</template>

<style scoped>
.devs {
    padding: clamp(16px, 2.5vw, 30px) clamp(16px, 3vw, 40px) 60px;
    display: flex;
    flex-direction: column;
    gap: clamp(40px, 6vw, 72px);
    max-width: 1240px;
    margin: 0 auto;
}

.kick {
    display: inline-block;
    font-family: var(--f-mono);
    font-size: 12px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--p);
    margin-bottom: 10px;
}

.h {
    font-size: clamp(22px, 4vw, 32px);
    margin-bottom: 24px;
}

/* ── герой ── */
.top {
    display: grid;
    gap: 28px;
}

.top__copy h1 {
    font-size: clamp(30px, 6vw, 52px);
    line-height: 1.05;
    letter-spacing: -.02em;
}

.lead {
    margin: 18px 0 26px;
    font-size: clamp(15px, 2vw, 18px);
    line-height: 1.6;
    color: var(--text-2);
    max-width: 520px;
}

.top__cta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

/* ── фишки ── */
.feats__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
}

.feat {
    padding: 22px;
}

.feat__ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--p) 20%, transparent);
    color: var(--p);
    font-size: 20px;
    margin-bottom: 14px;
}

.feat h3 {
    font-size: 17px;
    margin-bottom: 8px;
}

.feat p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-2);
}

/* ── комиссия ── */
.comm {
    display: grid;
    gap: 28px;
    padding: clamp(24px, 4vw, 40px);
}

.comm__l h2 {
    font-size: clamp(20px, 3.5vw, 28px);
    margin-bottom: 12px;
}

.comm__l p {
    margin-bottom: 22px;
    line-height: 1.6;
}

.switch {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14.5px;
    font-weight: 600;
}

.switch input {
    position: absolute;
    opacity: 0;
}

.switch__track {
    width: 46px;
    height: 26px;
    border-radius: 99px;
    background: var(--surf-2);
    border: 1px solid var(--border);
    transition: background .2s;
    flex: none;
}

.switch__dot {
    display: block;
    width: 20px;
    height: 20px;
    margin: 2px;
    border-radius: 50%;
    background: var(--muted);
    transition: transform .2s, background .2s;
}

.switch input:checked+.switch__track {
    background: color-mix(in srgb, var(--p) 40%, transparent);
    border-color: var(--p);
}

.switch input:checked+.switch__track .switch__dot {
    transform: translateX(20px);
    background: var(--p);
}

.calc__row {
    display: grid;
    gap: 10px;
    margin-bottom: 22px;
}

.calc__row>span {
    font-size: 13px;
    color: var(--text-2);
}

.calc__row b {
    font-family: var(--f-mono);
    font-size: 18px;
    color: var(--p);
}

.calc__row input[type=range] {
    width: 100%;
    accent-color: var(--p);
}

.calc__out {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
}

.calc__cell {
    padding: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
    text-align: center;
}

.calc__cell span {
    display: block;
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .5px;
}

.calc__cell b {
    font-family: var(--f-mono);
    font-size: clamp(20px, 4vw, 28px);
}

.calc__cell b.is-zero {
    color: var(--ok);
}

.calc__cell--hi {
    border-color: var(--p);
    background: color-mix(in srgb, var(--p) 12%, var(--bg));
}

.calc__cell--hi b {
    color: #fff;
}

.calc__arrow {
    color: var(--muted);
    font-size: 22px;
}

.calc__note {
    margin-top: 16px;
    padding: 12px 16px;
    background: color-mix(in srgb, var(--ok) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent);
    border-radius: var(--r);
    font-size: 13px;
    color: #7ce0c0;
}

/* ── как залить ── */
.how__steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 16px;
}

.step {
    display: flex;
    gap: 18px;
    align-items: flex-start;
}

.step__n {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 12px;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-weight: 600;
}

.step h3 {
    font-size: 17px;
    margin-bottom: 5px;
}

.step p {
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-2);
}

/* ── финал ── */
.fin {
    text-align: center;
    padding: clamp(30px, 5vw, 50px);
}

.fin h2 {
    font-size: clamp(22px, 4vw, 30px);
    margin-bottom: 12px;
}

.fin p {
    margin-bottom: 24px;
    max-width: 480px;
    margin-inline: auto;
    line-height: 1.6;
}

.fin__cta {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
}

@media (min-width: 900px) {
    .top {
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: 40px;
    }

    .feats__grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .comm {
        grid-template-columns: 1fr 1.2fr;
        align-items: center;
    }

    .how__steps {
        grid-template-columns: 1fr 1fr;
        gap: 24px 40px;
    }
}
</style>