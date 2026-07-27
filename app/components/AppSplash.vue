<script setup lang="ts">
/**
 * Заставка внутри приложения.
 *
 * Показываем в двух случаях:
 *   • приложение запущено как установленное PWA (display-mode: standalone)
 *   • или явно через ?splash=1 — для проверки в обычном браузере
 *
 * Внутри одной вкладки показываем один раз (sessionStorage),
 * чтобы не мелькать на каждой навигации. ?splash=1 игнорирует этот флаг.
 */
const visible = ref(false)
const leaving = ref(false)

function isStandalone() {
    if (typeof window === 'undefined') return false
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (navigator as any).standalone === true
    )
}

onMounted(() => {
    const forced = new URLSearchParams(location.search).has('splash')

    // временная диагностика — смотри в консоль браузера (F12)
    console.log('[splash] forced:', forced, '| standalone:', isStandalone(),
        '| уже показан в сессии:', Boolean(sessionStorage.getItem('splash-shown')))

    // forced обходит все проверки — удобно для отладки
    if (!forced) {
        if (!isStandalone()) return
        if (sessionStorage.getItem('splash-shown')) return
        sessionStorage.setItem('splash-shown', '1')
    }

    visible.value = true

    const hold = forced ? 2200 : 1000   // в режиме отладки держим дольше
    window.setTimeout(() => {
        leaving.value = true
        window.setTimeout(() => { visible.value = false }, 480)
    }, hold)
})
</script>

<template>
    <Transition name="splash">
        <div v-if="visible" class="splash" :class="{ 'is-leaving': leaving }" aria-hidden="true">
            <div class="splash__logo">
                <svg viewBox="0 0 120 120" class="mark">
                    <path class="mark__d mark__d--out" d="M60 8l52 52-52 52L8 60z" />
                    <path class="mark__d mark__d--in" d="M60 32l28 28-28 28-28-28z" />
                    <circle class="mark__c" cx="60" cy="60" r="7" />
                </svg>
                <span class="splash__ring" />
                <span class="splash__ring splash__ring--2" />
            </div>
            <span class="splash__word">dustore</span>
        </div>
    </Transition>
</template>

<style scoped>
.splash {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 26px;
    background: radial-gradient(circle at 50% 42%, #2a0b33 0%, #14041d 62%);
}

.splash__logo {
    position: relative;
    display: grid;
    place-items: center;
    width: 108px;
    height: 108px;
}

.mark {
    width: 92px;
    height: 92px;
    filter: drop-shadow(0 4px 20px rgba(195, 33, 120, .55));
    animation: pop .7s cubic-bezier(.2, 1, .3, 1);
}

.mark__d--out {
    fill: var(--p);
}

.mark__d--in {
    fill: #14041d;
}

.mark__c {
    fill: var(--p);
    animation: blink 1.4s ease-in-out infinite;
}

.splash__ring {
    position: absolute;
    inset: 0;
    border: 2px solid var(--p);
    border-radius: 26px;
    opacity: 0;
    animation: ripple 1.8s ease-out infinite;
}

.splash__ring--2 {
    animation-delay: .9s;
}

.splash__word {
    font-family: var(--f-brand), system-ui, sans-serif;
    font-size: 30px;
    letter-spacing: 2px;
    color: #fff;
    opacity: 0;
    animation: fadeUp .5s .25s forwards;
}

@keyframes pop {
    from {
        transform: scale(.5) rotate(-12deg);
        opacity: 0;
    }

    to {
        transform: scale(1) rotate(0);
        opacity: 1;
    }
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .3;
    }
}

@keyframes ripple {
    0% {
        transform: scale(.7);
        opacity: .7;
    }

    100% {
        transform: scale(1.6);
        opacity: 0;
    }
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.splash.is-leaving {
    opacity: 0;
    transition: opacity .48s ease;
}

.splash-leave-active {
    transition: opacity .48s ease;
}

.splash-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

    .mark,
    .mark__c,
    .splash__ring,
    .splash__word {
        animation: none;
        opacity: 1;
    }
}
</style>