<script setup lang="ts">
import { useLocalePath } from '#imports'
import type { DbGame } from '~~/server/db/games'

/** Профиль студии — как у пользователя, но с явной пометкой «Студия». */

interface Studio {
    id: number; name: string; tiker: string; ownerId: number | null; bio: string
    avatar: string | null; banner: string | null; vk: string | null; tg: string | null
    website: string | null; country: string | null; city: string | null
    teamSize: string | null; specialization: string | null; foundationDate: string | null
}

const route = useRoute()
const localePath = useLocalePath()
const { toast } = useToast()

const { data, error } = await useFetch<{ studio: Studio; games: DbGame[] }>(
    () => `/api/studios/${route.params.id}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Студия не найдена', fatal: true })

const studio = computed(() => data.value!.studio)
const games = computed(() => (data.value?.games ?? []).map(dbGameToGame))

useSeoMeta({ title: () => `${studio.value.name} — студия на Dustore` })

const initials = computed(() => studio.value.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())
const founded = computed(() => studio.value.foundationDate ? String(studio.value.foundationDate).slice(0, 4) : null)
const following = ref(false)
function follow() { following.value = !following.value; toast(following.value ? `Вы читаете ${studio.value.name}` : 'Отписались', 'ok') }
function share() {
    const url = location.origin + localePath(`/studio/${studio.value.id}`)
    navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована', 'ok'), () => toast(url))
}
</script>

<template>
    <div class="st">
        <div class="hero" :style="studio.banner ? { backgroundImage: `linear-gradient(180deg, rgba(20,4,29,.4), rgba(20,4,29,.92)), url('${studio.banner}')` } : undefined">
            <div class="wrap hero-in">
                <NuxtLink :to="localePath('/games')" class="back">←</NuxtLink>
                <div class="hero-top">
                    <span class="hero-av" :style="studio.avatar ? { backgroundImage: `url('${studio.avatar}')` } : undefined">
                        <span v-if="!studio.avatar">{{ initials }}</span>
                    </span>
                    <div class="hero-info">
                        <div class="badge-studio">◈ Студия</div>
                        <h1 class="hero-name">
                            {{ studio.name }}
                            <span v-if="studio.tiker" class="tiker">{{ studio.tiker }}</span>
                        </h1>
                        <p v-if="studio.bio" class="bio">{{ studio.bio }}</p>
                        <div class="chips">
                            <span v-if="studio.specialization" class="chip">{{ studio.specialization }}</span>
                            <span v-if="studio.teamSize" class="chip">👥 {{ studio.teamSize }} чел.</span>
                            <span v-if="studio.city || studio.country" class="chip">📍 {{ [studio.city, studio.country].filter(Boolean).join(', ') }}</span>
                            <span v-if="founded" class="chip">с {{ founded }}</span>
                            <span class="chip">{{ games.length }} игр</span>
                        </div>
                    </div>
                    <div class="hero-actions">
                        <button class="btn btn--primary btn--sm" :class="{ on: following }" @click="follow">
                            {{ following ? '✓ Читаю' : 'Читать' }}</button>
                        <button class="btn btn--sm" @click="share">Поделиться</button>
                    </div>
                </div>

                <div v-if="studio.vk || studio.tg || studio.website" class="links">
                    <a v-if="studio.website" :href="studio.website" target="_blank" rel="noopener" class="lnk">🌐 Сайт</a>
                    <a v-if="studio.vk" :href="studio.vk" target="_blank" rel="noopener" class="lnk">◈ VK</a>
                    <a v-if="studio.tg" :href="studio.tg" target="_blank" rel="noopener" class="lnk">✈ Telegram</a>
                </div>
            </div>
        </div>

        <div class="wrap body">
            <div class="sec-head"><h2>Игры студии</h2></div>
            <div v-if="!games.length" class="empty muted">Пока нет опубликованных игр.</div>
            <div v-else class="grid">
                <GameCard v-for="g in games" :key="g.id" :game="g" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.st { padding-bottom: 40px; }
.hero { background: var(--hero) center / cover; border-bottom: 1px solid var(--border); padding: clamp(20px, 5vw, 44px) 0 clamp(20px, 4vw, 34px); }
.hero-in { position: relative; }
.back { display: inline-grid; place-items: center; width: 38px; height: 38px; margin-bottom: 18px; border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; color: var(--text); font-size: 16px; }
.hero-top { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.hero-av {
    display: grid; place-items: center; width: 96px; height: 96px; flex: none; border-radius: 22px;
    background: var(--p) center / cover; color: #fff; font-family: var(--f-mono); font-weight: 600; font-size: 30px;
    box-shadow: 0 8px 30px -6px rgba(195, 33, 120, .6);
}
.hero-info { flex: 1; min-width: 220px; }
.badge-studio {
    display: inline-block; font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--p); background: color-mix(in srgb, var(--p) 16%, transparent); padding: 3px 9px; border-radius: 6px;
}
.hero-name { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: clamp(24px, 5vw, 34px); flex-wrap: wrap; }
.tiker { font-family: var(--f-mono); font-size: 12px; color: var(--text-2); background: rgba(255, 255, 255, .08); padding: 3px 9px; border-radius: 6px; }
.bio { margin: 12px 0 0; font-size: 15px; line-height: 1.55; max-width: 640px; color: var(--text); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chip { font-family: var(--f-mono); font-size: 11px; color: var(--text-2); background: rgba(255, 255, 255, .08); padding: 4px 10px; border-radius: 6px; }
.hero-actions { display: flex; flex-direction: column; gap: 8px; }
.hero-actions .btn.on { background: var(--p); border-color: var(--p); color: #fff; }
.links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.lnk { padding: 7px 14px; border: 1px solid var(--border); border-radius: 99px; font-size: 13px; color: var(--text-2); background: rgba(0, 0, 0, .2); }
.lnk:hover { border-color: var(--p); color: #fff; }

.body { margin-top: 24px; }
.sec-head h2 { font-family: var(--f-display); font-size: 20px; margin-bottom: 16px; }
.empty { padding: 40px 0; text-align: center; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 700px) { .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; } }
</style>
