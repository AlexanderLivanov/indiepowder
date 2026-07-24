<script setup lang="ts">
/**
 * Фича главной: игра, которая запускается прямо в герое.
 * Показывает главное обещание платформы — «играй в браузере, без установки».
 */
const canvas = ref<HTMLCanvasElement | null>(null)
const state = ref<'idle' | 'playing' | 'over'>('idle')
const score = ref(0)
const best = ref(0)
const time = ref(20)

let raf = 0
let ticker: ReturnType<typeof setInterval> | undefined

interface Bit { x: number; y: number; v: number; bad: boolean }

function start() {
    const cv = canvas.value
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const W = cv.width, H = cv.height

    state.value = 'playing'
    score.value = 0
    time.value = 20

    const player = { x: W / 2, y: H - 26, w: 26, h: 10 }
    let bits: Bit[] = []
    let spawn = 0

    // управление: мышь и палец
    function aim(clientX: number) {
        const r = cv!.getBoundingClientRect()
        player.x = ((clientX - r.left) / r.width) * W
    }
    const onMouse = (e: MouseEvent) => aim(e.clientX)
    const onTouch = (e: TouchEvent) => aim(e.touches[0]!.clientX)
    cv.addEventListener('mousemove', onMouse)
    cv.addEventListener('touchmove', onTouch, { passive: true })

    clearInterval(ticker)
    ticker = setInterval(() => {
        if (state.value !== 'playing') return
        time.value--
        if (time.value <= 0) stop()
    }, 1000)

    function stop() {
        state.value = 'over'
        best.value = Math.max(best.value, score.value)
        cancelAnimationFrame(raf)
        clearInterval(ticker)
        cv!.removeEventListener('mousemove', onMouse)
        cv!.removeEventListener('touchmove', onTouch)
    }

    function loop() {
        if (state.value !== 'playing') return

        // фон
        ctx.fillStyle = '#14041d'
        ctx.fillRect(0, 0, W, H)

        // сетка-«пиксели»
        ctx.fillStyle = 'rgba(255,255,255,.03)'
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1)

        // спавн
        if (--spawn <= 0) {
            spawn = 14
            bits.push({ x: Math.random() * (W - 8), y: -8, v: 1.4 + Math.random() * 1.6, bad: Math.random() < 0.22 })
        }

        // биты
        for (const b of bits) {
            b.y += b.v
            ctx.fillStyle = b.bad ? '#d63031' : '#c32178'
            ctx.fillRect(b.x, b.y, 8, 8)
            ctx.fillStyle = b.bad ? 'rgba(214,48,49,.28)' : 'rgba(195,33,120,.28)'
            ctx.fillRect(b.x - 2, b.y - 2, 12, 12)
        }

        // столкновения
        bits = bits.filter((b) => {
            const hit = b.y + 8 >= player.y && b.y <= player.y + player.h
                && b.x + 8 >= player.x - player.w / 2 && b.x <= player.x + player.w / 2
            if (hit) {
                score.value += b.bad ? -3 : 1
                if (score.value < 0) score.value = 0
                return false
            }
            return b.y < H + 10
        })

        // игрок
        ctx.fillStyle = '#f8f9fa'
        ctx.fillRect(player.x - player.w / 2, player.y, player.w, player.h)
        ctx.fillStyle = 'rgba(248,249,250,.25)'
        ctx.fillRect(player.x - player.w / 2 - 2, player.y - 2, player.w + 4, player.h + 4)

        raf = requestAnimationFrame(loop)
    }
    loop()
}

onUnmounted(() => { cancelAnimationFrame(raf); clearInterval(ticker) })
</script>

<template>
    <div class="play">
        <div class="play__stage">
            <canvas ref="canvas" width="320" height="200" class="play__canvas" />

            <div v-if="state !== 'playing'" class="play__overlay">
                <p v-if="state === 'over'" class="play__result">
                    {{ $t('hero.score') }}: <b>{{ score }}</b>
                </p>
                <button class="btn btn--primary" @click="start">
                    {{ state === 'over' ? $t('hero.again') : $t('hero.playDemo') }}
                </button>
                <p class="play__hint">{{ $t('hero.control') }}</p>
            </div>

            <div v-else class="play__hud">
                <span>{{ $t('hero.score') }} <b>{{ score }}</b></span>
                <span class="play__time">{{ time }}s</span>
            </div>
        </div>

        <p class="play__cap">
            <span class="dot" />{{ $t('hero.noInstall') }}<template v-if="best"> · {{ $t('hero.best') }} {{ best
                }}</template>
        </p>
    </div>
</template>

<style scoped>
.play {
    width: 100%;
}

.play__stage {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: #14041d;
    aspect-ratio: 320 / 200;
}

.play__canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    cursor: crosshair;
    touch-action: none;
}

.play__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(20, 4, 29, .82);
    backdrop-filter: blur(2px);
}

.play__result {
    margin: 0;
    font-family: var(--f-mono);
    font-size: 14px;
    color: var(--text-2);
}

.play__result b {
    color: #fff;
    font-size: 17px;
}

.play__hint {
    margin: 0;
    font-family: var(--f-mono);
    font-size: 10.5px;
    color: var(--muted);
}

.play__hud {
    position: absolute;
    top: 8px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--text-2);
    pointer-events: none;
}

.play__hud b {
    color: #fff;
}

.play__time {
    color: var(--p);
}

.play__cap {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 10px 0 0;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--muted);
}
</style>