<script setup lang="ts">
import { useLocalePath } from '#imports'

/**
 * /u/:username — публичный профиль.
 * Сначала ищем реального пользователя платформы (таблица users);
 * если такого ника нет — показываем автора ленты (демо StayInspired).
 */

interface PUser {
    id: number; nick: string; displayName: string | null; avatarUrl: string | null
    city: string | null; country: string | null; about: string | null
    website: string | null; vk: string | null; telegram: string | null
    role: string; verified: boolean; l4tRole: string | null
    votesUp: number; votesDown: number; profileViews: number; registered: string | null
}
interface Author {
    name: string; handle: string; kind: 'author' | 'studio'
    bio: string; followers: string; following: string; initials: string
}
interface FeedPost {
    id: string; kind: string; author: string; handle: string; ago: string
    title?: string; body?: string; excerpt?: string; up: number; replies: number
}

const route = useRoute()
const localePath = useLocalePath()
const { toast } = useToast()

const { data: userRes } = await useFetch<{ user: PUser }>(
    () => `/api/users/${route.params.handle}`, { default: () => null as any })
const puser = computed<PUser | null>(() => userRes.value?.user ?? null)

// автор ленты — только если реального пользователя нет
const { data: authorRes } = await useFetch<{ author: Author; posts: FeedPost[] }>(
    () => `/api/authors/${route.params.handle}`, { default: () => null as any })
const author = computed<Author | null>(() => authorRes.value?.author ?? null)
const posts = computed<FeedPost[]>(() => authorRes.value?.posts ?? [])

if (!puser.value && !author.value)
    throw createError({ statusCode: 404, statusMessage: 'Профиль не найден', fatal: true })

const title = computed(() => puser.value?.nick || author.value?.name || 'Профиль')
useSeoMeta({ title: () => `${title.value} — Dustore` })

function initials(n: string) {
    return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const regDate = computed(() => {
    if (!puser.value?.registered) return '—'
    try { return new Date(puser.value.registered).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return '—' }
})
const roleLabel = computed(() => {
    const r = puser.value?.role
    return r === 'root' ? 'Основатель' : r === 'moder' ? 'Модератор' : 'Игрок'
})

const following = ref(false)
function follow() { following.value = !following.value; toast(following.value ? `Вы читаете ${title.value}` : 'Отписались', 'ok') }
function share() {
    const url = location.origin + localePath(`/u/${route.params.handle}`)
    navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована', 'ok'), () => toast(url))
}
</script>

<template>
    <div class="up">
        <!-- ═══════ ПОЛЬЗОВАТЕЛЬ ПЛАТФОРМЫ ═══════ -->
        <template v-if="puser">
            <div class="hero">
                <div class="wrap hero-in">
                    <NuxtLink :to="localePath('/')" class="back">←</NuxtLink>
                    <div class="hero-top">
                        <span class="hero-av"
                            :style="puser.avatarUrl ? { backgroundImage: `url(${puser.avatarUrl})` } : undefined">
                            <span v-if="!puser.avatarUrl">{{ puser.nick.slice(0, 2).toUpperCase() }}</span>
                        </span>
                        <div class="hero-info">
                            <h1 class="hero-name">
                                {{ puser.nick }}
                                <span v-if="puser.verified" class="vfd" title="Подтверждён">✓</span>
                            </h1>
                            <p v-if="puser.displayName" class="hero-sub">{{ puser.displayName }}</p>
                            <div class="chips">
                                <span class="chip">{{ roleLabel }}</span>
                                <span v-if="puser.l4tRole" class="chip">{{ puser.l4tRole }}</span>
                                <span v-if="puser.city" class="chip">📍 {{ puser.city }}<template
                                        v-if="puser.country">, {{ puser.country }}</template></span>
                            </div>
                        </div>
                        <div class="hero-actions">
                            <button class="btn btn--primary btn--sm" :class="{ on: following }" @click="follow">
                                {{ following ? '✓ Читаю' : 'Читать' }}
                            </button>
                            <button class="btn btn--sm" @click="share">Поделиться</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="wrap body">
                <div class="cols">
                    <div v-if="puser.about" class="card blk">
                        <h2>О себе</h2>
                        <p class="about">{{ puser.about }}</p>
                    </div>
                    <div class="card blk">
                        <h2>Ссылки</h2>
                        <ul class="links">
                            <li v-if="puser.website"><span>🌐</span><a :href="puser.website" target="_blank"
                                    rel="noopener">{{ puser.website }}</a></li>
                            <li v-if="puser.vk"><span>◈</span><a :href="puser.vk" target="_blank" rel="noopener">{{
                                puser.vk }}</a></li>
                            <li v-if="puser.telegram"><span>✈</span><span>@{{ puser.telegram }}</span></li>
                            <li v-if="!puser.website && !puser.vk && !puser.telegram" class="muted">Ссылок пока нет</li>
                        </ul>
                    </div>
                    <dl class="stats">
                        <div><dt>{{ puser.votesUp }}</dt><dd>оценок</dd></div>
                        <div><dt>{{ puser.profileViews }}</dt><dd>просмотров</dd></div>
                        <div><dt>{{ regDate }}</dt><dd>на платформе</dd></div>
                        <div><dt>#{{ puser.id }}</dt><dd>DustID</dd></div>
                    </dl>
                </div>
            </div>
        </template>

        <!-- ═══════ АВТОР ЛЕНТЫ (fallback) ═══════ -->
        <template v-else-if="author">
            <div class="hero">
                <div class="wrap hero-in">
                    <NuxtLink :to="localePath('/feed')" class="back">←</NuxtLink>
                    <div class="hero-top">
                        <span class="hero-av"><span>{{ author.initials }}</span></span>
                        <div class="hero-info">
                            <h1 class="hero-name">{{ author.name }}
                                <span class="kind">{{ author.kind === 'studio' ? 'Студия' : 'Автор' }}</span>
                            </h1>
                            <p class="hero-sub">@{{ author.handle }}</p>
                            <p v-if="author.bio" class="about">{{ author.bio }}</p>
                            <div class="chips">
                                <span class="chip">{{ posts.length }} публикаций</span>
                                <span class="chip">{{ author.followers }} читателей</span>
                            </div>
                        </div>
                        <div class="hero-actions">
                            <button class="btn btn--primary btn--sm" :class="{ on: following }" @click="follow">
                                {{ following ? '✓ Читаю' : 'Читать' }}</button>
                            <button class="btn btn--sm" @click="share">Поделиться</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="wrap body">
                <div class="feed">
                    <NuxtLink v-for="p in posts" :key="p.id" :to="localePath(`/p/${p.id}`)" class="card post">
                        <div class="pmeta"><b>{{ author.name }}</b> · <span class="muted">@{{ author.handle }} · {{ p.ago
                        }}</span></div>
                        <div v-if="p.title" class="ptitle">{{ p.title }}</div>
                        <p v-else class="pbody">{{ p.body }}</p>
                        <div class="preact"><span>✶ {{ p.up }}</span><span>↳ {{ p.replies }}</span></div>
                    </NuxtLink>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.up { padding-bottom: 40px; }
.hero { background: var(--hero); border-bottom: 1px solid var(--border); padding: clamp(20px, 5vw, 44px) 0 clamp(24px, 5vw, 40px); }
.hero-in { position: relative; }
.back { display: inline-grid; place-items: center; width: 38px; height: 38px; margin-bottom: 18px; border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; color: var(--text); font-size: 16px; }
.hero-top { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.hero-av {
    display: grid; place-items: center; width: 88px; height: 88px; flex: none; border-radius: 24px;
    background: var(--p) center / cover; color: #fff; font-family: var(--f-mono); font-weight: 600; font-size: 28px;
    box-shadow: 0 8px 30px -6px rgba(195, 33, 120, .6);
}
.hero-info { flex: 1; min-width: 220px; }
.hero-name { display: flex; align-items: center; gap: 10px; font-size: clamp(24px, 5vw, 34px); flex-wrap: wrap; }
.hero-sub { margin: 4px 0 0; font-family: var(--f-mono); font-size: 14px; color: var(--text-2); }
.about { margin: 12px 0 0; font-size: 15px; line-height: 1.55; max-width: 560px; white-space: pre-wrap; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chip {
    font-family: var(--f-mono); font-size: 11px; color: var(--text-2);
    background: rgba(255, 255, 255, .08); padding: 4px 10px; border-radius: 6px;
}
.kind { font-family: var(--f-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-2); background: rgba(255, 255, 255, .08); padding: 3px 9px; border-radius: 6px; }
.vfd { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--p); color: #fff; font-size: 12px; }
.hero-actions { display: flex; flex-direction: column; gap: 8px; }
.hero-actions .btn.on { background: var(--p); border-color: var(--p); color: #fff; }

.body { margin-top: 22px; }
.cols { display: grid; gap: 14px; max-width: 720px; }
.blk { padding: 16px 18px; }
.blk h2 { font-size: 16px; margin-bottom: 10px; }
.links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.links li { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.links a { color: #66c0f4; word-break: break-all; }
.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 0; }
.stats > div { padding: 14px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); }
.stats dt { font-family: var(--f-mono); font-size: 17px; font-weight: 600; color: var(--p); }
.stats dd { margin: 4px 0 0; font-size: 11.5px; color: var(--text-2); }

.feed { display: flex; flex-direction: column; gap: 12px; max-width: 720px; }
.post { display: block; padding: 14px 16px; color: inherit; }
.post:hover { border-color: var(--p); }
.pmeta { font-size: 13px; }
.ptitle { margin-top: 6px; font-family: var(--f-display); font-size: 18px; font-weight: 700; }
.pbody { margin: 8px 0 0; font-size: 15px; line-height: 1.55; }
.preact { display: flex; gap: 14px; margin-top: 10px; font-family: var(--f-mono); font-size: 12px; color: var(--text-2); }

@media (min-width: 760px) {
    .stats { grid-template-columns: repeat(4, 1fr); }
}
</style>
