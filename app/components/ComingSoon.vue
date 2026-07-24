<script setup lang="ts">
import { useLocalePath } from '#imports'
defineProps<{ icon: string; title: string; text: string; eta?: string }>()
const localePath = useLocalePath()
</script>

<template>
    <div class="wrap cs">
        <div class="cs__box pxc">
            <span class="cs__ic">{{ icon }}</span>
            <p class="eyebrow"><span class="dot" />{{ eta || $t('soon.tag') }}</p>
            <h1>{{ title }}</h1>
            <p class="muted cs__text">{{ text }}</p>
            <div class="cs__cta">
                <NuxtLink :to="localePath('/games')" class="btn btn--primary">{{ $t('error.browse') }}</NuxtLink>
                <NuxtLink :to="localePath('/')" class="btn">{{ $t('error.home') }}</NuxtLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cs {
    padding-block: clamp(30px, 8vw, 70px);
    display: flex;
    justify-content: center;
}

.cs__box {
    width: 100%;
    max-width: 520px;
    padding: clamp(26px, 6vw, 42px);
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    text-align: center;
}

.cs__ic {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    margin: 0 auto 18px;
    border-radius: 16px;
    background: var(--surf-2);
    color: var(--violet);
    font-size: 26px;
}

.cs .eyebrow {
    justify-content: center;
}

.cs__box h1 {
    margin-top: 12px;
    font-size: clamp(22px, 5.5vw, 30px);
}

.cs__text {
    margin: 12px auto 0;
    max-width: 400px;
    font-size: 14px;
}

.cs__cta {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
}
</style>