<script setup lang="ts">
import { useLocalePath } from '#imports'

const props = defineProps<{
    title: string
    sub?: string
    games: Game[]
    to?: string
    accent?: string
}>()

const localePath = useLocalePath()
const track = ref<HTMLElement | null>(null)

function scroll(dir: 1 | -1) {
    const el = track.value
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
}
</script>

<template>
    <section class="grail" :style="accent ? { '--grail-accent': accent } : undefined">
        <header class="grail__head">
            <div class="grail__titles">
                <h2>{{ title }}</h2>
                <p v-if="sub" class="grail__sub muted">{{ sub }}</p>
            </div>

            <div class="grail__ctrl">
                <NuxtLink v-if="to" :to="localePath(to)" class="more">{{ $t('sections.all') }}</NuxtLink>
                <button class="arrow" :aria-label="$t('rail.prev')" @click="scroll(-1)">‹</button>
                <button class="arrow" :aria-label="$t('rail.next')" @click="scroll(1)">›</button>
            </div>
        </header>

        <div ref="track" class="grail__track">
            <div v-for="g in games" :key="g.id" class="grail__cell">
                <GameCard :game="g" />
            </div>
        </div>
    </section>
</template>

<style scoped>
.grail {
    --grail-accent: var(--p);
    margin-top: clamp(30px, 6vw, 48px);
}

.grail__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
}

.grail__titles {
    min-width: 0;
}

.grail__head h2 {
    font-size: clamp(17px, 4.4vw, 23px);
    display: flex;
    align-items: center;
    gap: 9px;
}

.grail__head h2::before {
    content: '';
    width: 4px;
    height: 18px;
    border-radius: 2px;
    background: var(--grail-accent);
    flex: none;
}

.grail__sub {
    margin: 6px 0 0;
    font-size: 12.5px;
    max-width: 520px;
}

.grail__ctrl {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
}

.arrow {
    display: none;
    place-items: center;
    width: 32px;
    height: 32px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-2);
    font-size: 18px;
    line-height: 1;
}

.arrow:hover {
    border-color: var(--grail-accent);
    color: #fff;
}

/* лента: свайп на мобиле, стрелки на десктопе */
.grail__track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 46%;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    margin-inline: calc(var(--pad) * -1);
    padding-inline: var(--pad);
    padding-block: 4px 8px;
}

.grail__track::-webkit-scrollbar {
    display: none;
}

.grail__cell {
    scroll-snap-align: start;
}

@media (min-width: 640px) {
    .grail__track {
        grid-auto-columns: 240px;
        gap: 16px;
    }
}

@media (min-width: 1000px) {
    .arrow {
        display: grid;
    }

    /* раскрытие карточки не должно резаться границей ленты */
    .grail__track {
        overflow: visible;
        scroll-snap-type: none;
        grid-auto-columns: minmax(0, 1fr);
        grid-template-columns: repeat(5, 1fr);
        grid-auto-flow: row;
    }

    .grail__cell:nth-child(n+6) {
        display: none;
    }

    .arrow {
        display: none;
    }
}
</style>