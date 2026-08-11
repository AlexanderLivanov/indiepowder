<script setup lang="ts">
import { useLocalePath } from '#imports'

definePageMeta({ layout: 'console' })

const localePath = useLocalePath()

interface Project { id: string; name: string; genre: string; status: string; cover: string | null; rating: number; ratingCount: number }
const { data } = await useFetch<{ projects: Project[] }>('/api/console/projects', { default: () => ({ projects: [] }) })
const projects = computed(() => data.value?.projects ?? [])

const filter = ref<'all' | 'published' | 'draft' | 'closed'>('all')
const q = ref('')
const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'published', label: 'Опубликованные' },
    { id: 'draft', label: 'Черновики' },
    { id: 'closed', label: 'Закрытые' },
] as const

const shown = computed(() => {
    const s = q.value.trim().toLowerCase()
    return projects.value.filter(p =>
        (filter.value === 'all' || p.status === filter.value) &&
        (!s || p.name.toLowerCase().includes(s) || p.genre.toLowerCase().includes(s)),
    )
})

const STATUS: Record<string, { cls: string; label: string }> = {
    published: { cls: 'pub', label: 'Опубликован' },
    draft: { cls: 'draft', label: 'Черновик' },
    closed: { cls: 'closed', label: 'Закрыт' },
}
function st(s: string) { return STATUS[s] || STATUS.draft! }
function cover(p: Project) { return p.cover && p.cover.startsWith('http') ? { backgroundImage: `url("${p.cover}")` } : undefined }

useSeoMeta({ title: 'Проекты — Dustore.Devs' })
</script>

<template>
    <div class="pr">
        <div class="bar">
            <div class="tabs">
                <button v-for="t in tabs" :key="t.id" class="tab" :class="{ on: filter === t.id }"
                    @click="filter = t.id">{{ t.label }}</button>
            </div>
            <div class="search">
                <span class="material-icons">search</span>
                <input v-model="q" type="search" placeholder="Поиск по проектам…">
            </div>
        </div>

        <div v-if="!shown.length" class="card empty">
            <span class="material-icons">videogame_asset</span>
            <p class="muted">Ничего не найдено</p>
            <NuxtLink :to="localePath('/console/new')" class="btn btn--primary btn--sm">＋ Новый проект</NuxtLink>
        </div>

        <div v-else class="plist">
            <NuxtLink v-for="p in shown" :key="p.id" :to="localePath(`/console/edit?id=${p.id}`)" class="card prow">
                <span class="prow__cover" :style="cover(p)" />
                <div class="prow__i">
                    <div class="prow__name">{{ p.name }}</div>
                    <div class="prow__meta muted">
                        {{ p.genre || '—' }}<template v-if="p.rating"> · ★ {{ p.rating.toFixed(1) }}</template>
                    </div>
                </div>
                <span class="badge" :class="'b-' + st(p.status).cls">{{ st(p.status).label }}</span>
                <span class="material-icons prow__go">chevron_right</span>
            </NuxtLink>
        </div>
    </div>
</template>

<style scoped>
.pr { display: flex; flex-direction: column; gap: 16px; }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tabs { display: flex; gap: 3px; padding: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); flex-wrap: wrap; }
.tab { min-height: 34px; padding: 0 13px; background: none; border: none; border-radius: var(--r-sm); color: var(--text-2); font-family: var(--f-mono); font-size: 12px; }
.tab.on { background: var(--p); color: #fff; }
.search { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); color: var(--muted); flex: 1 1 200px; }
.search .material-icons { font-size: 18px; }
.search input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--text); font: inherit; }
.search input::placeholder { color: var(--muted); }

.empty { padding: 46px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty .material-icons { font-size: 40px; color: var(--p); }

.plist { display: flex; flex-direction: column; gap: 10px; }
.prow { display: flex; align-items: center; gap: 14px; padding: 14px; color: inherit; transition: border-color .15s; }
.prow:hover { border-color: var(--p); }
.prow__cover { width: 52px; height: 52px; flex: none; border-radius: 10px; background: var(--surf-2) center / cover no-repeat; }
.prow__i { flex: 1; min-width: 0; }
.prow__name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prow__meta { font-size: 11.5px; margin-top: 2px; }
.prow__go { color: var(--muted); font-size: 20px; }
.badge { font-family: var(--f-mono); font-size: 10.5px; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
.b-pub { background: rgba(0, 184, 148, .18); color: var(--ok); }
.b-draft { background: rgba(255, 255, 255, .07); color: var(--muted); }
.b-closed { background: rgba(214, 48, 49, .18); color: #ff9b9c; }
</style>
