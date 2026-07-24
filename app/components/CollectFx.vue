<script setup lang="ts">
/** «Распаковка» при добавлении в коллекцию. Должно ощущаться как новый айфон. */
const props = defineProps<{ game: Game }>()
const open = defineModel<boolean>({ default: false })

const phase = ref<'seal' | 'lift' | 'reveal' | 'done'>('seal')

// пиксельные частицы разлетаются в момент вскрытия
const bits = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 260,
    y: (Math.random() - 0.5) * 200,
    d: Math.random() * 0.25,
    s: 4 + Math.round(Math.random() * 5),
}))

watch(open, (v) => {
    if (!v) return
    phase.value = 'seal'
    setTimeout(() => (phase.value = 'lift'), 260)
    setTimeout(() => (phase.value = 'reveal'), 780)
    setTimeout(() => (phase.value = 'done'), 1600)
    setTimeout(() => (open.value = false), 2900)
})
</script>

<template>
    <Teleport to="body">
        <Transition name="fx">
            <div v-if="open" class="fx" @click="open = false">
                <div class="fx__scene" :class="`is-${phase}`">
                    <!-- частицы -->
                    <span v-for="b in bits" :key="b.id" class="fx__bit" :style="{
                        '--bx': b.x + 'px',
                        '--by': b.y + 'px',
                        '--bd': b.d + 's',
                        width: b.s + 'px',
                        height: b.s + 'px',
                    }" />

                    <!-- коробка -->
                    <div class="box">
                        <div class="box__lid" />
                        <div class="box__cover" :style="{ background: game.cover }">
                            <span class="box__shine" />
                        </div>
                    </div>

                    <div class="fx__text">
                        <p class="fx__added">{{ $t('collect.added') }}</p>
                        <h3>{{ game.title }}</h3>
                        <p class="muted">{{ $t('collect.inLibrary') }}</p>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fx {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: center;
    background: rgba(8, 2, 12, .88);
    backdrop-filter: blur(10px);
}

.fx__scene {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    perspective: 900px;
}

/* ---- коробка ---- */
.box {
    position: relative;
    width: 172px;
    height: 220px;
    transform-style: preserve-3d;
    transition: transform .7s cubic-bezier(.2, .8, .2, 1);
}

.is-seal .box {
    transform: rotateX(14deg) scale(.9);
}

.is-lift .box {
    transform: rotateX(6deg) scale(1);
}

.is-reveal .box,
.is-done .box {
    transform: rotateX(0) scale(1.04);
}

/* крышка — уезжает вверх */
.box__lid {
    position: absolute;
    inset: 0 0 auto;
    height: 100%;
    border-radius: 18px;
    background: linear-gradient(160deg, #2c0c3a, #14041d);
    border: 1px solid var(--border);
    box-shadow: 0 20px 50px rgba(0, 0, 0, .6), inset 0 1px 0 #ffffff18;
    z-index: 2;
    transition: transform .72s cubic-bezier(.3, .9, .2, 1), opacity .5s ease .2s;
}

.box__lid::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    width: 26px;
    height: 26px;
    background: var(--p);
}

.is-lift .box__lid {
    transform: translateY(-14px);
}

.is-reveal .box__lid,
.is-done .box__lid {
    transform: translateY(-150%) rotateX(38deg);
    opacity: 0;
}

/* обложка под крышкой */
.box__cover {
    position: absolute;
    inset: 0;
    border-radius: 18px;
    border: 1px solid var(--p);
    overflow: hidden;
    opacity: 0;
    transform: scale(.94);
    transition: opacity .45s ease, transform .55s cubic-bezier(.2, .8, .2, 1);
}

.is-reveal .box__cover,
.is-done .box__cover {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 1px var(--p), 0 18px 50px -10px var(--p);
}

/* блик проезжает по обложке */
.box__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, .55) 48%, transparent 62%);
    background-size: 260% 100%;
    background-position: 130% 0;
    mix-blend-mode: overlay;
}

.is-reveal .box__shine,
.is-done .box__shine {
    animation: sweep 1.1s ease .18s both;
}

@keyframes sweep {
    to {
        background-position: -60% 0;
    }
}

/* ---- частицы ---- */
.fx__bit {
    position: absolute;
    top: 44%;
    left: 50%;
    background: var(--p);
    opacity: 0;
    border-radius: 1px;
}

.is-reveal .fx__bit,
.is-done .fx__bit {
    animation: burst .95s cubic-bezier(.15, .8, .3, 1) var(--bd) both;
}

@keyframes burst {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--bx)), calc(-50% + var(--by))) scale(.4);
    }
}

/* ---- подпись ---- */
.fx__text {
    text-align: center;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity .5s ease .15s, transform .5s ease .15s;
}

.is-reveal .fx__text,
.is-done .fx__text {
    opacity: 1;
    transform: none;
}

.fx__added {
    margin: 0;
    font-family: var(--f-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--p);
}

.fx__text h3 {
    margin: 6px 0 4px;
    font-family: var(--f-brand);
    font-size: 24px;
}

.fx__text p.muted {
    margin: 0;
    font-size: 12.5px;
}

.fx-enter-active,
.fx-leave-active {
    transition: opacity .35s;
}

.fx-enter-from,
.fx-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

    .box,
    .box__lid,
    .box__cover,
    .fx__bit,
    .fx__text {
        transition: none !important;
        animation: none !important;
    }

    .box__lid {
        opacity: 0;
    }

    .box__cover,
    .fx__text {
        opacity: 1;
        transform: none;
    }
}
</style>