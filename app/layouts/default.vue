<script setup lang="ts">
/** Лёгкий параллакс: сайдбар и хедер чуть отклоняются к курсору (только ПК). */
const shell = ref<HTMLElement | null>(null)
let raf = 0

function onMove(e: MouseEvent) {
    if (raf) return
    raf = requestAnimationFrame(() => {
        raf = 0
        const el = shell.value
        if (!el) return
        const px = (e.clientX / window.innerWidth) * 2 - 1   // -1..1
        const py = (e.clientY / window.innerHeight) * 2 - 1
        el.style.setProperty('--px', px.toFixed(3))
        el.style.setProperty('--py', py.toFixed(3))
    })
}

onMounted(() => {
    if (
        window.matchMedia('(hover: hover) and (min-width: 1000px)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        window.addEventListener('mousemove', onMove, { passive: true })
    }
})
onUnmounted(() => { window.removeEventListener('mousemove', onMove); if (raf) cancelAnimationFrame(raf) })
</script>

<template>
    <div ref="shell" class="shell">
        <!-- десктоп: сайдбар-островок слева -->
        <AppSidebar class="shell__sb" />

        <div class="shell__col">
            <AppTopbar class="shell__tb" />
            <main class="shell__main">
                <slot />
            </main>
            <AppFooter class="shell__ft" />
        </div>

        <!-- мобилка: островки -->
        <MobileIslands />
        <AppToast />
        <AppSplash />
        <WhatsNew />
    </div>
</template>

<style scoped>
.shell {
    min-height: 100dvh;
    --px: 0;
    --py: 0;
}

/* параллакс-наклон островков к курсору (ПК) */
@media (min-width: 1000px) {

    .shell__sb,
    .shell__tb {
        transition: transform .35s cubic-bezier(.22, 1, .36, 1);
        will-change: transform;
    }

    .shell__sb {
        transform:
            perspective(1400px)
            rotateY(calc(var(--px) * 1.1deg))
            rotateX(calc(var(--py) * -0.9deg))
            translateX(calc(var(--px) * 3px));
        transform-origin: left center;
    }

    .shell__tb {
        transform:
            perspective(1400px)
            rotateX(calc(var(--py) * -0.7deg))
            translateY(calc(var(--py) * 2px))
            translateX(calc(var(--px) * 3px));
        transform-origin: center top;
    }
}

.shell__col {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    min-width: 0;
}

.shell__main {
    flex: 1;
}

.shell__sb,
.shell__tb {
    display: none;
}

/* ── мобилка: работают островки ── */
@media (max-width: 999px) {
    .shell {
        padding-top: calc(62px + env(safe-area-inset-top));
        padding-bottom: calc(84px + env(safe-area-inset-bottom));
    }

    .shell__col {
        min-height: auto;
    }
}

/* ── десктоп: сайдбар-островок + плавающий хедер ── */
@media (min-width: 1000px) {
    .shell {
        display: grid;
        grid-template-columns: 244px minmax(0, 1fr);
        align-items: start;
    }

    .shell__sb {
        display: flex;
    }

    .shell__tb {
        display: grid;
    }
}
</style>