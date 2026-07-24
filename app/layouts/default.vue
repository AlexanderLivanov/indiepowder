<template>
    <div class="shell">
        <!-- десктоп: сайдбар слева -->
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
    </div>
</template>

<style scoped>
.shell {
    min-height: 100dvh;
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

/* ── мобилка: сайдбар и топбар прячем, работают островки ── */
.shell__sb,
.shell__tb {
    display: none;
}

@media (max-width: 999px) {
    .shell {
        padding-top: calc(62px + env(safe-area-inset-top));
        padding-bottom: calc(84px + env(safe-area-inset-bottom));
    }

    .shell__col {
        min-height: auto;
    }
}

/* ── десктоп ── */
@media (min-width: 1000px) {
    .shell {
        display: grid;
        grid-template-columns: 232px minmax(0, 1fr);
    }

    .shell__sb {
        display: flex;
    }

    .shell__tb {
        display: grid;
    }
}
</style>