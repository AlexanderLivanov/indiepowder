<script setup lang="ts">
const { list } = useToast()
</script>

<template>
    <Teleport to="body">
        <div class="toasts">
            <TransitionGroup name="t">
                <div v-for="t in list" :key="t.id" class="toast" :class="`is-${t.kind}`">
                    <span class="toast__ic">{{ t.kind === 'ok' ? '✔' : t.kind === 'err' ? '✕' : '•' }}</span>
                    <span>{{ t.text }}</span>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.toasts {
    position: fixed;
    left: 50%;
    bottom: calc(72px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 250;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
    width: min(420px, calc(100vw - 24px));
}

.toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 15px;
    background: var(--surf-2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .5);
    font-size: 13.5px;
    max-width: 100%;
}

.toast.is-ok {
    border-color: rgba(46, 204, 113, .5);
}

.toast.is-err {
    border-color: rgba(214, 48, 49, .5);
}

.toast__ic {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex: none;
    border-radius: 6px;
    background: var(--p);
    color: #fff;
    font-size: 11px;
}

.toast.is-ok .toast__ic {
    background: #2ecc71;
    color: #04241a;
}

.toast.is-err .toast__ic {
    background: var(--err);
}

.t-enter-active,
.t-leave-active {
    transition: all .28s cubic-bezier(.2, .7, .2, 1);
}

.t-enter-from,
.t-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(.96);
}

@media (min-width: 900px) {
    .toasts {
        bottom: 24px;
    }
}
</style>