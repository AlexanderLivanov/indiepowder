<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Панель подбора игры «Во что хотите сыграть?» */
const localePath = useLocalePath()
const q = ref('')

const chips = [
    { key: 'novel', icon: '📖' },
    { key: 'horror', icon: '💀' },
    { key: 'coop', icon: '👥' },
    { key: 'short', icon: '🕐' },
    { key: 'chill', icon: '🍃' },
]

function ask(text?: string) {
    const v = (text ?? q.value).trim()
    navigateTo(localePath(v ? `/games?q=${encodeURIComponent(v)}` : '/games'))
}
</script>

<template>
    <section class="ai">
        <div class="ai__bot" aria-hidden="true">
            <div class="ai__face">
                <span class="ai__eye" /><span class="ai__eye" />
            </div>
            <span class="ai__gem" />
        </div>

        <div class="ai__text">
            <h1>{{ $t('ai.title') }}</h1>
            <p class="muted">{{ $t('ai.sub') }}</p>
        </div>

        <div class="ai__form">
            <div class="ai__field">
                <input v-model="q" type="text" :placeholder="$t('ai.placeholder')" @keydown.enter="ask()">
                <button class="ai__go" :aria-label="$t('ai.go')" @click="ask()">→</button>
            </div>

            <div class="ai__chips">
                <button v-for="c in chips" :key="c.key" class="chipb" @click="ask($t(`ai.${c.key}`))">
                    <span>{{ c.icon }}</span>{{ $t(`ai.${c.key}`) }}
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ai {
    display: grid;
    gap: 18px;
    padding: clamp(18px, 3vw, 26px);
    background: linear-gradient(120deg, #2a0b33 0%, #1d0726 55%, #14041d 100%);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
}

/* робот-талисман */
.ai__bot {
    position: relative;
    display: grid;
    place-items: center;
    width: 108px;
    height: 108px;
    justify-self: center;
    border-radius: 28px;
    background: radial-gradient(circle at 50% 35%, #a86ec9, #6f3f8f 70%);
    box-shadow: 0 12px 34px -8px rgba(168, 110, 201, .6);
}

.ai__face {
    display: flex;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 18px;
    background: #1b0724;
}

.ai__eye {
    width: 11px;
    height: 15px;
    border-radius: 6px;
    background: #ff9ecb;
    animation: blink 4.5s infinite;
}

@keyframes blink {

    0%,
    94%,
    100% {
        transform: scaleY(1)
    }

    97% {
        transform: scaleY(.12)
    }
}

.ai__gem {
    position: absolute;
    bottom: 14px;
    width: 12px;
    height: 12px;
    background: var(--p);
    transform: rotate(45deg);
}

.ai__text h1 {
    font-size: clamp(21px, 3.4vw, 30px);
}

.ai__text p {
    margin: 8px 0 0;
    font-size: 14px;
    max-width: 340px;
}

.ai__field {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 16px;
    background: rgba(0, 0, 0, .35);
    border: 1px solid var(--border);
    border-radius: 14px;
}

.ai__field:focus-within {
    border-color: var(--p);
}

.ai__field input {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font: inherit;
    font-size: 14.5px;
}

.ai__field input::placeholder {
    color: var(--muted);
}

.ai__go {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: none;
    border: none;
    border-radius: 11px;
    background: var(--p);
    color: #fff;
    font-size: 18px;
}

.ai__go:hover {
    background: var(--p-hov);
}

.ai__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.chipb {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 38px;
    padding: 0 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-2);
    font-size: 13px;
}

.chipb:hover {
    border-color: var(--p);
    color: #fff;
}

@media (min-width: 900px) {
    .ai {
        grid-template-columns: 108px 1fr minmax(320px, 46%);
        align-items: center;
        gap: 24px;
    }

    .ai__bot {
        justify-self: start;
    }
}
</style>