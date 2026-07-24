<script setup lang="ts">
const props = defineProps<{ game: Game }>()
const open = defineModel<boolean>({ default: false })

const state = ref<'boot' | 'run'>('boot')
const pct = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

watch(open, (v) => {
    clearInterval(timer)
    if (!v) return
    state.value = 'boot'
    pct.value = 0
    // имитация загрузки билда — потом здесь будет реальный iframe со сборкой
    timer = setInterval(() => {
        pct.value = Math.min(100, pct.value + Math.random() * 18 + 6)
        if (pct.value >= 100) {
            clearInterval(timer)
            setTimeout(() => (state.value = 'run'), 300)
        }
    }, 180)
})

function close() {
    clearInterval(timer)
    open.value = false
}

onUnmounted(() => clearInterval(timer))
</script>

<template>
    <Teleport to="body">
        <Transition name="pl">
            <div v-if="open" class="pl">
                <header class="pl__bar">
                    <span class="pl__dot" />
                    <b>{{ game.title }}</b>
                    <span class="muted pl__eng">{{ game.engine }}</span>
                    <button class="pl__x" :aria-label="$t('nav.close')" @click="close">✕</button>
                </header>

                <div class="pl__stage">
                    <!-- загрузка билда -->
                    <div v-if="state === 'boot'" class="boot">
                        <div class="boot__cover" :style="{ background: game.cover }" />
                        <p class="boot__t">{{ $t('play.booting') }}</p>
                        <div class="boot__bar">
                            <div :style="{ width: pct + '%' }" />
                        </div>
                        <span class="boot__p">{{ Math.round(pct) }}%</span>
                    </div>

                    <!-- запущенный билд (пока — демо-канвас) -->
                    <div v-else class="run">
                        <HeroPlay />
                        <p class="run__note muted">{{ $t('play.stub') }}</p>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.pl {
    position: fixed;
    inset: 0;
    z-index: 280;
    display: flex;
    flex-direction: column;
    background: #0b0210;
}

.pl__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    padding-top: calc(11px + env(safe-area-inset-top));
    border-bottom: 1px solid var(--border);
    background: var(--bg);
}

.pl__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2ecc71;
    flex: none;
}

.pl__bar b {
    font-family: var(--f-display);
    font-size: 14px;
}

.pl__eng {
    font-family: var(--f-mono);
    font-size: 11px;
}

.pl__x {
    margin-left: auto;
    width: 34px;
    height: 34px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text-2);
}

.pl__x:hover {
    color: #fff;
    border-color: var(--p);
}

.pl__stage {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 20px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
    overflow: auto;
}

.boot {
    text-align: center;
    width: min(300px, 100%);
}

.boot__cover {
    width: 96px;
    height: 96px;
    margin: 0 auto 18px;
    border-radius: 18px;
    border: 1px solid var(--border);
    animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
    50% {
        transform: scale(1.05);
        opacity: .8
    }
}

.boot__t {
    margin: 0 0 12px;
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--text-2);
}

.boot__bar {
    height: 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, .08);
    overflow: hidden;
}

.boot__bar div {
    height: 100%;
    background: linear-gradient(90deg, var(--p), var(--violet));
    transition: width .2s;
}

.boot__p {
    display: block;
    margin-top: 8px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--muted);
}

.run {
    width: min(560px, 100%);
}

.run__note {
    margin: 12px 0 0;
    font-size: 11.5px;
    text-align: center;
}

.pl-enter-active,
.pl-leave-active {
    transition: opacity .28s;
}

.pl-enter-from,
.pl-leave-to {
    opacity: 0;
}
</style>