<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
    <footer class="foot">
        <div class="wrap foot__in">
            <div class="foot__brand">
                <NuxtLink :to="localePath('/')" class="brand">
                    <span class="brand__mark" />dustore
                </NuxtLink>
                <p class="muted">{{ $t('footer.tagline') }}</p>
            </div>

            <nav class="foot__col">
                <h4>{{ $t('footer.platform') }}</h4>
                <NuxtLink :to="localePath('/games')">{{ $t('nav.games') }}</NuxtLink>
                <NuxtLink :to="localePath('/assets')">{{ $t('nav.assets') }}</NuxtLink>
                <NuxtLink :to="localePath('/jams')">{{ $t('nav.jams') }}</NuxtLink>
                <NuxtLink :to="localePath('/crews')">{{ $t('nav.crews') }}</NuxtLink>
            </nav>

            <nav class="foot__col">
                <h4>{{ $t('footer.create') }}</h4>
                <NuxtLink :to="localePath('/console')">{{ $t('footer.console') }}</NuxtLink>
                <NuxtLink :to="localePath('/devlogs')">{{ $t('nav.devlogs') }}</NuxtLink>
            </nav>

            <nav class="foot__col">
                <h4>{{ $t('footer.account') }}</h4>
                <NuxtLink :to="localePath('/login')">{{ $t('nav.login') }}</NuxtLink>
                <NuxtLink :to="localePath('/profile')">{{ $t('footer.profile') }}</NuxtLink>
            </nav>
        </div>

        <div class="wrap foot__legal">
            {{ $t('footer.rights') }}
        </div>
    </footer>
</template>

<style scoped>
.foot {
    margin-top: clamp(48px, 10vw, 90px);
    border-top: 1px solid var(--border);
    padding-top: 36px;
    padding-bottom: calc(28px + env(safe-area-inset-bottom));
}

.foot__in {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 20px;
}

.foot__brand {
    grid-column: 1 / -1;
}

.foot__brand p {
    margin: 10px 0 0;
    font-size: 14px;
    max-width: 320px;
}

.brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-family: var(--f-brand);
    font-size: 20px;
}

.brand__mark {
    width: 10px;
    height: 10px;
    background: var(--p);
    transform: rotate(45deg);
}

.foot__col {
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.foot__col h4 {
    margin: 0 0 3px;
    font-family: var(--f-display);
    font-size: 14px;
}

.foot__col a {
    font-size: 14px;
    color: var(--text-2);
}

.foot__col a:hover {
    color: var(--p);
}

.foot__legal {
    margin-top: 30px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--muted);
}

@media (min-width: 720px) {
    .foot__in {
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 40px;
    }

    .foot__brand {
        grid-column: auto;
    }
}
</style>