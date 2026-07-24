<script setup lang="ts">
import { useLocalePath } from '#imports'

defineProps<{
    title: string
    to?: string
    items: { id: string; title: string; cover: string; price?: number; progress?: number }[]
}>()

const localePath = useLocalePath()
</script>

<template>
    <section class="mr">
        <NuxtLink :to="localePath(to || '/games')" class="mr__h">
            {{ title }}<span>›</span>
        </NuxtLink>

        <div class="mr__list">
            <NuxtLink v-for="i in items" :key="i.id" :to="localePath(`/games/${i.id}`)" class="mc">
                <span class="mc__cover" :style="{ background: i.cover }" />
                <span class="mc__t">{{ i.title }}</span>

                <template v-if="i.progress !== undefined">
                    <span class="mc__pct">{{ i.progress }}%</span>
                    <span class="mc__bar"><span :style="{ width: i.progress + '%' }" /></span>
                </template>
                <span v-else class="mc__price" :class="{ 'is-free': !i.price }">
                    {{ i.price ? i.price.toLocaleString('ru-RU') + ' ₽' : $t('game.free') }}
                </span>
            </NuxtLink>
        </div>
    </section>
</template>

<style scoped>
.mr {
    min-width: 0;
}

.mr__h {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-family: var(--f-display);
    font-weight: 800;
    font-size: 15px;
}

.mr__h span {
    color: var(--muted);
}

.mr__h:hover {
    color: var(--p);
}

.mr__list {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 96px;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
}

.mr__list::-webkit-scrollbar {
    display: none;
}

.mc {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.mc__cover {
    height: 96px;
    border-radius: 9px;
    border: 1px solid var(--border);
    transition: transform .18s, border-color .18s;
}

.mc:hover .mc__cover {
    transform: translateY(-3px);
    border-color: var(--p);
}

.mc__t {
    margin-top: 7px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mc__pct {
    margin-top: 3px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--p);
}

.mc__bar {
    display: block;
    height: 3px;
    margin-top: 4px;
    border-radius: 2px;
    background: var(--surf-2);
    overflow: hidden;
}

.mc__bar span {
    display: block;
    height: 100%;
    background: var(--p);
}

.mc__price {
    margin-top: 3px;
    font-family: var(--f-mono);
    font-size: 11.5px;
    color: var(--warn);
}

.mc__price.is-free {
    color: #2ecc71;
}
</style>