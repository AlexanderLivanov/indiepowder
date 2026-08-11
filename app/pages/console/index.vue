<script setup lang="ts">
import { useLocalePath } from '#imports'

definePageMeta({ layout: 'console' })

const localePath = useLocalePath()

interface Project { id: string; name: string; genre: string; status: string; cover: string | null; rating: number; ratingCount: number }
const { data } = await useFetch<{ projects: Project[] }>('/api/console/projects', { default: () => ({ projects: [] }) })
const projects = computed(() => data.value?.projects ?? [])

const avgRating = computed(() => {
    const rated = projects.value.filter(p => p.rating > 0)
    if (!rated.length) return '—'
    return (rated.reduce((s, p) => s + p.rating, 0) / rated.length).toFixed(1)
})

const STATUS: Record<string, { cls: string; label: string }> = {
    published: { cls: 'pub', label: 'Опубликован' },
    draft: { cls: 'draft', label: 'Черновик' },
    closed: { cls: 'closed', label: 'Закрыт' },
}
function st(s: string) { return STATUS[s] || STATUS.draft! }
function cover(p: Project) { return p.cover && p.cover.startsWith('http') ? { backgroundImage: `url("${p.cover}")` } : undefined }

useSeoMeta({ title: 'Обзор — Dustore.Devs' })
</script>

<template>
    <div class="dash">
        <!-- статы -->
        <div class="stats">
            <div class="stat card">
                <span class="stat__ic material-icons">videogame_asset</span>
                <div class="stat__num">{{ projects.length }}</div>
                <div class="stat__lbl">Проекты</div>
            </div>
            <div class="stat card">
                <span class="stat__ic material-icons">people</span>
                <div class="stat__num">—</div>
                <div class="stat__lbl">Игроков</div>
            </div>
            <div class="stat card">
                <span class="stat__ic material-icons">star</span>
                <div class="stat__num">{{ avgRating }}</div>
                <div class="stat__lbl">Средний рейтинг</div>
            </div>
            <div class="stat card">
                <span class="stat__ic material-icons">groups</span>
                <div class="stat__num">—</div>
                <div class="stat__lbl">Сотрудники</div>
            </div>
        </div>

        <div class="cols">
            <!-- проекты -->
            <section>
                <div class="sec-head">
                    <h2>Проекты</h2>
                    <NuxtLink :to="localePath('/console/projects')" class="sec-link">Все →</NuxtLink>
                </div>

                <div v-if="!projects.length" class="card empty">
                    <span class="material-icons">add_circle_outline</span>
                    <p class="muted">Проектов пока нет</p>
                    <NuxtLink :to="localePath('/console/new')" class="btn btn--primary btn--sm">＋ Создать</NuxtLink>
                </div>
                <div v-else class="plist">
                    <NuxtLink v-for="p in projects.slice(0, 5)" :key="p.id"
                        :to="localePath(`/console/edit?id=${p.id}`)" class="card prow">
                        <span class="prow__cover" :style="cover(p)" />
                        <div class="prow__i">
                            <div class="prow__name">{{ p.name }}</div>
                            <div class="prow__genre muted">{{ p.genre || '—' }}</div>
                        </div>
                        <span class="badge" :class="'b-' + st(p.status).cls">{{ st(p.status).label }}</span>
                    </NuxtLink>
                </div>
            </section>

            <!-- отзывы -->
            <section>
                <div class="sec-head"><h2>Последние отзывы</h2></div>
                <div class="card revs">
                    <p class="muted">Отзывов пока нет</p>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 20px; }

.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 720px) { .stats { grid-template-columns: repeat(4, 1fr); } }
.stat { padding: 16px; }
.stat__ic {
    display: grid; place-items: center; width: 40px; height: 40px; border-radius: 11px;
    background: color-mix(in srgb, var(--p) 18%, transparent); color: var(--p); font-size: 20px; margin-bottom: 12px;
}
.stat__num { font-family: var(--f-display); font-weight: 800; font-size: 26px; }
.stat__lbl { margin-top: 2px; font-size: 12.5px; color: var(--text-2); }

.cols { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 1000px) { .cols { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; } }
.sec-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.sec-head h2 { font-family: var(--f-display); font-size: 17px; }
.sec-link { font-family: var(--f-mono); font-size: 12px; color: var(--text-2); }
.sec-link:hover { color: var(--p); }

.empty { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty .material-icons { font-size: 40px; color: var(--p); }

.plist { display: flex; flex-direction: column; gap: 10px; }
.prow { display: flex; align-items: center; gap: 14px; padding: 14px; color: inherit; transition: border-color .15s; }
.prow:hover { border-color: var(--p); }
.prow__cover { width: 52px; height: 52px; flex: none; border-radius: 10px; background: var(--surf-2) center / cover no-repeat; }
.prow__i { flex: 1; min-width: 0; }
.prow__name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prow__genre { font-size: 11.5px; margin-top: 2px; }
.badge { font-family: var(--f-mono); font-size: 10.5px; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
.b-pub { background: rgba(0, 184, 148, .18); color: var(--ok); }
.b-draft { background: rgba(255, 255, 255, .07); color: var(--muted); }
.b-closed { background: rgba(214, 48, 49, .18); color: #ff9b9c; }

.revs { padding: 24px; text-align: center; font-size: 13px; }
</style>
