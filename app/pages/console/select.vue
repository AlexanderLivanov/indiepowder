<script setup lang="ts">
import { useLocalePath } from '#imports'

definePageMeta({ layout: 'console' })

/** Выбор студии при входе в консоль. */
const localePath = useLocalePath()

interface Studio { id: number; name: string; tiker: string; specialization: string | null; avatar: string | null; city: string | null; country: string | null }
const { data } = await useFetch<{ studios: Studio[] }>('/api/console/context', { default: () => ({ studios: [] }) })
const studios = computed(() => data.value?.studios ?? [])

function choose(id: number) {
    if (!import.meta.client) return
    // ВАЖНО: пишем cookie СИНХРОННО (useCookie флашит на nextTick — перезагрузка
    // успевала уйти раньше записи, и выбор «сбрасывался»).
    document.cookie = `dustore_studio=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    // жёсткий переход — чтобы консоль перечитала контекст под новую студию
    window.location.href = localePath('/console')
}
function initials(n: string) { return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }

useSeoMeta({ title: 'Выбор студии — Dustore.Devs' })
</script>

<template>
    <div class="sel">
        <div class="sel__head">
            <h1>Выберите студию</h1>
            <p class="muted">Консоль работает в контексте одной студии. Позже можно переключиться.</p>
        </div>

        <div v-if="!studios.length" class="card empty">
            <span class="material-icons">apartment</span>
            <p class="muted">У вас пока нет студий.</p>
            <a href="/regorg" class="btn btn--primary btn--sm">Создать студию</a>
        </div>

        <div v-else class="grid">
            <button v-for="s in studios" :key="s.id" class="scard card" @click="choose(s.id)">
                <span class="scard__ava" :style="s.avatar ? { backgroundImage: `url('${s.avatar}')` } : undefined">
                    <template v-if="!s.avatar">{{ initials(s.name) }}</template>
                </span>
                <div class="scard__i">
                    <div class="scard__name">{{ s.name }}<span v-if="s.tiker" class="scard__tk">{{ s.tiker }}</span></div>
                    <div class="scard__meta muted">
                        {{ s.specialization || '—' }}<template v-if="s.city"> · {{ s.city }}</template>
                    </div>
                </div>
                <span class="material-icons scard__go">arrow_forward</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.sel { max-width: 720px; margin: 0 auto; }
.sel__head { margin-bottom: 22px; }
.sel__head h1 { font-family: var(--f-display); font-size: clamp(24px, 5vw, 32px); }
.sel__head p { margin: 8px 0 0; font-size: 14px; }

.empty { padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty .material-icons { font-size: 44px; color: var(--p); }

.grid { display: flex; flex-direction: column; gap: 12px; }
.scard { display: flex; align-items: center; gap: 14px; padding: 16px; text-align: left; color: inherit; cursor: pointer; transition: border-color .15s, transform .15s; }
.scard:hover { border-color: var(--p); transform: translateY(-1px); }
.scard__ava {
    display: grid; place-items: center; width: 52px; height: 52px; flex: none; border-radius: 13px;
    background: var(--p) center / cover no-repeat; color: #fff; font-family: var(--f-mono); font-weight: 600; font-size: 16px; overflow: hidden;
}
.scard__i { flex: 1; min-width: 0; }
.scard__name { display: flex; align-items: center; gap: 9px; font-family: var(--f-display); font-weight: 700; font-size: 16px; }
.scard__tk { font-family: var(--f-mono); font-size: 10px; color: var(--text-2); background: var(--surf-2); padding: 2px 7px; border-radius: 5px; }
.scard__meta { font-size: 12.5px; margin-top: 3px; }
.scard__go { color: var(--muted); }
.scard:hover .scard__go { color: var(--p); }
</style>
