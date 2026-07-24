<script setup lang="ts">
export interface Provider {
    id: string
    name: string
    mark: string
    color: string
    ink?: string
}

const props = defineProps<{ providers: Provider[]; modelValue?: Provider | null }>()
const emit = defineEmits<{ 'update:modelValue': [Provider] }>()

const showAll = ref(false)

// первые три — самые популярные, они крупные
const top = computed(() => props.providers.slice(0, 3))
const rest = computed(() => props.providers.slice(3))
</script>

<template>
    <div class="tiles">
        <!-- топ-3 -->
        <div class="tiles__row tiles__row--top">
            <button v-for="p in top" :key="p.id" class="tile tile--big" :class="{ 'is-on': modelValue?.id === p.id }"
                :style="{ '--brand': p.color, '--ink': p.ink || '#fff' }" @click="emit('update:modelValue', p)">
                <span class="tile__mark">{{ p.mark }}</span>
                <span class="tile__name">{{ p.name }}</span>
            </button>
        </div>

        <!-- остальные -->
        <div class="tiles__row tiles__row--rest" :class="{ 'is-open': showAll }">
            <button v-for="p in rest" :key="p.id" class="tile" :class="{ 'is-on': modelValue?.id === p.id }"
                :style="{ '--brand': p.color, '--ink': p.ink || '#fff' }" @click="emit('update:modelValue', p)">
                <span class="tile__mark tile__mark--sm">{{ p.mark }}</span>
                <span class="tile__name tile__name--sm">{{ p.name }}</span>
            </button>
        </div>

        <button v-if="rest.length" class="more" @click="showAll = !showAll">
            {{ showAll ? $t('auth.less') : $t('auth.more', { n: rest.length }) }}
            <span class="more__arrow" :class="{ 'is-up': showAll }">▾</span>
        </button>
    </div>
</template>

<style scoped>
.tiles {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tiles__row {
    display: grid;
    gap: 10px;
}

.tiles__row--top {
    grid-template-columns: repeat(3, 1fr);
}

/* остальные сервисы свёрнуты по умолчанию */
.tiles__row--rest {
    grid-template-columns: repeat(4, 1fr);
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height .32s ease, opacity .25s ease;
}

.tiles__row--rest.is-open {
    max-height: 320px;
    opacity: 1;
}

.tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 76px;
    padding: 12px 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--text-2);
    transition: border-color .18s, transform .18s, box-shadow .18s;
}

.tile:hover {
    border-color: var(--brand);
    transform: translateY(-2px);
}

.tile.is-on {
    border-color: var(--brand);
    box-shadow: 0 0 0 1px var(--brand), 0 8px 22px -8px var(--brand);
    background: color-mix(in srgb, var(--brand) 10%, var(--bg));
}

.tile--big {
    min-height: 96px;
}

.tile__mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: var(--brand);
    color: var(--ink);
    font-family: var(--f-mono);
    font-weight: 700;
    font-size: 15px;
}

.tile__mark--sm {
    width: 32px;
    height: 32px;
    font-size: 12px;
    border-radius: 9px;
}

.tile__name {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 12.5px;
    color: #fff;
    text-align: center;
    line-height: 1.2;
}

.tile__name--sm {
    font-size: 11px;
}

.more {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 14px;
    background: none;
    border: none;
    color: var(--text-2);
    font-family: var(--f-mono);
    font-size: 12px;
}

.more:hover {
    color: var(--p);
}

.more__arrow {
    transition: transform .25s;
}

.more__arrow.is-up {
    transform: rotate(180deg);
}

@media (max-width: 420px) {
    .tiles__row--rest {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>