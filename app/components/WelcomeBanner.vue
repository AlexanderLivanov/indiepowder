<script setup lang="ts">
const KEY = 'dustore_seen_v3'

const show = ref(false)

// ВАЖНО: localStorage читаем только после монтирования.
// На сервере его нет — если прочитать раньше, разъедется гидрация.
onMounted(() => {
    if (!localStorage.getItem(KEY)) show.value = true
})

function close() {
    localStorage.setItem(KEY, '1')
    show.value = false
}

const news = [
    { ic: '⬆', key: 'upload', accent: 'var(--p)' },
    { ic: '▶', key: 'web', accent: 'var(--ok)' },
    { ic: '▦', key: 'assets', accent: 'var(--violet)' },
    { ic: '◇', key: 'ether', accent: '#2AABEE' },
    { ic: '◈', key: 'zero', accent: 'var(--warn)' },
    { ic: '▣', key: 'pwa', accent: 'var(--p)' },
]
</script>

<template>
    <Teleport to="body">
        <Transition name="pop">
            <div v-if="show" class="wel" role="dialog" aria-modal="true" @click.self="close">
                <div class="wel__box pxc">
                    <div class="wel__glow" aria-hidden="true" />

                    <button class="wel__x" :aria-label="$t('nav.close')" @click="close">✕</button>

                    <div class="wel__head">
                        <span class="wel__badge">v3.0</span>
                        <h2 class="wel__title">{{ $t('welcome.title') }}</h2>
                        <p class="wel__sub muted">{{ $t('welcome.sub') }}</p>
                    </div>

                    <ul class="wel__list">
                        <li v-for="n in news" :key="n.key">
                            <span class="wel__ic" :style="{ color: n.accent, borderColor: n.accent }">{{ n.ic }}</span>
                            <div>
                                <b>{{ $t(`welcome.${n.key}`) }}</b>
                                <span class="muted">{{ $t(`welcome.${n.key}_d`) }}</span>
                            </div>
                        </li>
                    </ul>

                    <button class="btn btn--primary wel__go" @click="close">{{ $t('welcome.cta') }}</button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.wel {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    background: rgba(0, 0, 0, .68);
    backdrop-filter: blur(6px);
}

.wel__box {
    position: relative;
    width: 100%;
    max-width: 560px;
    max-height: 92dvh;
    overflow-y: auto;
    padding: clamp(24px, 5vw, 34px);
    padding-bottom: calc(clamp(24px, 5vw, 34px) + env(safe-area-inset-bottom));
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg) var(--r-lg) 0 0;
}

.wel__glow {
    position: absolute;
    top: -90px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    height: 220px;
    background: var(--p);
    filter: blur(90px);
    opacity: .34;
    pointer-events: none;
}

.wel__x {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--muted);
}

.wel__x:hover {
    color: #fff;
    border-color: var(--p);
}

.wel__head {
    position: relative;
    text-align: center;
}

.wel__badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 99px;
    background: var(--p);
    color: #fff;
    font-family: var(--f-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
}

.wel__title {
    margin: 14px 0 0;
    font-family: var(--f-brand);
    font-size: clamp(24px, 6vw, 34px);
    line-height: 1.12;
}

.wel__sub {
    margin: 10px 0 0;
    font-size: 14px;
}

.wel__list {
    display: grid;
    gap: 10px;
    margin: 24px 0 0;
    padding: 0;
    list-style: none;
}

.wel__list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.wel__list b {
    display: block;
    font-family: var(--f-display);
    font-size: 14px;
}

.wel__list span.muted {
    font-size: 12.5px;
    line-height: 1.45;
}

.wel__ic {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border: 1px solid;
    border-radius: 10px;
    font-size: 15px;
}

.wel__go {
    width: 100%;
    margin-top: 22px;
}

.pop-enter-active,
.pop-leave-active {
    transition: opacity .3s;
}

.pop-enter-active .wel__box,
.pop-leave-active .wel__box {
    transition: transform .34s cubic-bezier(.2, .7, .2, 1);
}

.pop-enter-from,
.pop-leave-to {
    opacity: 0;
}

.pop-enter-from .wel__box,
.pop-leave-to .wel__box {
    transform: translateY(100%);
}

@media (min-width: 700px) {
    .wel {
        align-items: center;
        padding: 20px;
    }

    .wel__box {
        border-radius: var(--r-lg);
    }

    .wel__list {
        grid-template-columns: 1fr 1fr;
    }

    .pop-enter-from .wel__box,
    .pop-leave-to .wel__box {
        transform: translateY(24px) scale(.97);
    }
}
</style>