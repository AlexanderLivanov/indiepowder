<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Квадратная карточка приложения: иконка вместо обложки (стиль магазина). */
const props = defineProps<{ app: MobileApp; rank?: number }>()
const localePath = useLocalePath()

const price = computed(() => props.app.price === 0 ? 'Загрузить' : `${props.app.price.toLocaleString('ru-RU')} ₽`)
</script>

<template>
    <NuxtLink :to="localePath(`/apps/${app.id}`)" class="acard">
        <div v-if="rank" class="acard__rank">{{ rank }}</div>
        <div class="acard__icon" :style="{ background: app.icon }">
            <span class="acard__glyph">{{ app.glyph }}</span>
        </div>
        <div class="acard__body">
            <h3 class="acard__name">{{ app.name }}</h3>
            <p class="acard__cat">{{ app.category }}</p>
            <div class="acard__foot">
                <span class="acard__rating">★ {{ app.rating.toFixed(1) }}</span>
                <span class="acard__get">{{ price }}</span>
            </div>
        </div>
    </NuxtLink>
</template>

<style scoped>
.acard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 10px 14px;
    border-radius: var(--r-lg);
    color: inherit;
    transition: background .15s;
}
.acard:hover { background: rgba(255, 255, 255, .04); }
.acard__rank {
    align-self: flex-start;
    margin: -2px 0 -6px 2px;
    font-family: var(--f-display);
    font-size: 15px;
    font-weight: 800;
    color: var(--muted);
}
.acard__icon {
    position: relative;
    width: 100%;
    max-width: 120px;
    aspect-ratio: 1;
    border-radius: 24%;
    display: grid;
    place-items: center;
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, .55), inset 0 0 0 1px rgba(255, 255, 255, .08);
    overflow: hidden;
}
.acard__glyph {
    font-family: var(--f-display);
    font-weight: 800;
    font-size: clamp(30px, 8vw, 46px);
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, .35);
}
.acard__body { width: 100%; text-align: center; min-width: 0; }
.acard__name {
    margin: 0;
    font-family: var(--f-display);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.acard__cat {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.acard__foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 9px;
}
.acard__rating { font-family: var(--f-mono); font-size: 11px; color: var(--warn); }
.acard__get {
    padding: 4px 14px;
    border-radius: 99px;
    background: color-mix(in srgb, var(--p) 20%, transparent);
    color: #fff;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 12px;
}
.acard:hover .acard__get { background: var(--p); }
</style>
