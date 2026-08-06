<script setup lang="ts">
import { useLocalePath } from '#imports'

/**
 * Кликабельный автор: имя/ник → /u/:handle.
 * При наведении (десктоп) всплывает мини-профиль: аватар, био, статы, «Читать».
 * На тач-устройствах карточка не показывается — обычный переход по тапу.
 */

interface Author {
    name: string; handle: string; kind: 'author' | 'studio'
    bio: string; followers: string; following: string; initials: string
}

const props = defineProps<{ handle: string }>()
const localePath = useLocalePath()
const { toast } = useToast()

const clean = computed(() => props.handle.replace(/^@/, ''))
const to = computed(() => localePath(`/u/${clean.value}`))

/* общий кэш профилей на всё приложение — один фетч на автора */
const cache = useState<Record<string, Author | null>>('authorCache', () => ({}))

const anchor = ref<HTMLElement | null>(null)
const open = ref(false)
const card = ref<Author | null>(null)
const pos = reactive({ x: 0, y: 0 })
const following = ref(false)
let hoverT: any = null
let hideT: any = null

const canHover = import.meta.client
    && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

async function load() {
    if (clean.value in cache.value) { card.value = cache.value[clean.value] ?? null; return }
    try {
        const r = await $fetch<{ author: Author }>(`/api/authors/${clean.value}`)
        cache.value[clean.value] = r.author
        card.value = r.author
    } catch {
        cache.value[clean.value] = null
        card.value = null
    }
}

function place() {
    // ref на <NuxtLink> — это инстанс компонента; берём его корневой <a>
    const a = anchor.value as any
    const el: HTMLElement | null = a?.$el ?? a
    if (!el?.getBoundingClientRect) return
    const r = el.getBoundingClientRect()
    // ширина карточки 288; держим в пределах вьюпорта
    pos.x = Math.min(Math.max(12, r.left), window.innerWidth - 300)
    pos.y = r.bottom + 8
}

function enter() {
    if (!canHover) return
    clearTimeout(hideT)
    hoverT = setTimeout(async () => {
        await load()
        place()
        open.value = true
    }, 220)
}
function leave() {
    clearTimeout(hoverT)
    hideT = setTimeout(() => { open.value = false }, 160)
}
function cardEnter() { clearTimeout(hideT) }
function cardLeave() { open.value = false }

function follow() {
    following.value = !following.value
    toast(following.value ? `Вы читаете ${card.value?.name}` : 'Отписались', 'ok')
}

onUnmounted(() => { clearTimeout(hoverT); clearTimeout(hideT) })
</script>

<template>
    <NuxtLink ref="anchor" :to="to" class="alink" @mouseenter="enter" @mouseleave="leave">
        <slot />
    </NuxtLink>

    <Teleport to="body">
        <Transition name="hc">
            <div v-if="open && card" class="hcard" :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
                @mouseenter="cardEnter" @mouseleave="cardLeave">
                <div class="hc-top">
                    <span class="hc-av">{{ card.initials }}</span>
                    <NuxtLink :to="to" class="hc-follow-wrap">
                        <button class="hc-follow" :class="{ on: following }" @click.prevent="follow">
                            {{ following ? '✓ Читаю' : 'Читать' }}
                        </button>
                    </NuxtLink>
                </div>
                <NuxtLink :to="to" class="hc-name">
                    {{ card.name }}
                    <span class="hc-kind">{{ card.kind === 'studio' ? 'Студия' : 'Автор' }}</span>
                </NuxtLink>
                <div class="hc-handle">@{{ card.handle }}</div>
                <p v-if="card.bio" class="hc-bio">{{ card.bio }}</p>
                <div class="hc-stats">
                    <span><b>{{ card.followers }}</b> читателей</span>
                    <span><b>{{ card.following }}</b> читает</span>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.alink { color: inherit; cursor: pointer; transition: color .15s; }
.alink:hover { color: var(--p); }

.hcard {
    position: fixed;
    z-index: 300;
    width: 288px;
    padding: 14px;
    background: var(--surf-2);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, .6);
}
.hc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hc-av {
    display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%;
    background: var(--p); color: #fff; font-family: var(--f-mono); font-size: 15px; font-weight: 600;
}
.hc-follow {
    padding: 7px 16px; border: 1px solid var(--p); border-radius: 99px; background: none;
    color: var(--p); font-family: var(--f-display); font-size: 13px; font-weight: 700;
}
.hc-follow.on { background: var(--p); color: #fff; }
.hc-name {
    display: flex; align-items: center; gap: 8px; font-family: var(--f-display);
    font-size: 16px; font-weight: 700; color: var(--text);
}
.hc-kind {
    font-family: var(--f-mono); font-size: 9px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--text-2); background: var(--surf); padding: 2px 7px; border-radius: 5px;
}
.hc-handle { font-family: var(--f-mono); font-size: 12px; color: var(--muted); margin-top: 2px; }
.hc-bio { margin: 9px 0 0; font-size: 13px; line-height: 1.5; color: var(--text-2); }
.hc-stats { display: flex; gap: 16px; margin-top: 11px; font-size: 12.5px; color: var(--muted); }
.hc-stats b { color: var(--text); font-family: var(--f-mono); }

.hc-enter-active, .hc-leave-active { transition: opacity .16s, transform .16s; }
.hc-enter-from, .hc-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
