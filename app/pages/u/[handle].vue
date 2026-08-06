<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Публичный профиль автора/студии + его лента (порт /u/:handle). */

interface FeedMedia { type: 'image' | 'video'; label: string }
interface FeedReply { author: string; handle: string; ago: string; body: string }
interface FeedPost {
    id: string; kind: 'spark' | 'note' | 'article' | 'line' | 'thread'
    author: string; handle: string; ago: string; number?: number
    title?: string; body?: string; excerpt?: string; content?: string[]
    media?: FeedMedia; reply?: FeedReply; up: number; replies: number
}
interface Author {
    name: string; handle: string; kind: 'author' | 'studio'
    bio: string; followers: string; following: string; initials: string
}

const route = useRoute()
const localePath = useLocalePath()
const { toast } = useToast()

const { data, error } = await useFetch<{ author: Author; posts: FeedPost[] }>(
    () => `/api/authors/${route.params.handle}`)

if (error.value) throw createError({ statusCode: 404, statusMessage: 'Автор не найден', fatal: true })

const author = computed(() => data.value!.author)
const posts = computed(() => data.value?.posts ?? [])

useSeoMeta({ title: () => `${author.value.name} — Dustore` })

const following = ref(false)
function follow() { following.value = !following.value; toast(following.value ? `Вы читаете ${author.value.name}` : 'Отписались', 'ok') }
function share() {
    const url = location.origin + localePath(`/u/${author.value.handle}`)
    navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована', 'ok'), () => toast(url))
}
function excerpt(p: FeedPost) { return (p.excerpt || p.body || '').slice(0, 160) }
</script>

<template>
    <div class="authorpage">
        <!-- hero -->
        <div class="hero">
            <div class="wrap hero-in">
                <NuxtLink :to="localePath('/feed')" class="back">←</NuxtLink>
                <div class="hero-top">
                    <span class="hero-av">{{ author.initials }}</span>
                    <div class="hero-info">
                        <h1 class="hero-name">
                            {{ author.name }}
                            <span class="kind-badge">{{ author.kind === 'studio' ? 'Студия' : 'Автор' }}</span>
                        </h1>
                        <div class="hero-handle">@{{ author.handle }}</div>
                        <p v-if="author.bio" class="hero-bio">{{ author.bio }}</p>
                        <div class="hero-stats">
                            <div><b>{{ posts.length }}</b> публикаций</div>
                            <div><b>{{ author.followers }}</b> читателей</div>
                            <div><b>{{ author.following }}</b> читает</div>
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

        <!-- посты -->
        <div class="wrap body">
            <div v-if="!posts.length" class="empty muted">Пока нет публикаций.</div>
            <div class="feed">
                <NuxtLink v-for="p in posts" :key="p.id" :to="localePath(`/p/${p.id}`)" class="card post"
                    :class="p.kind">
                    <div class="post-meta">
                        <span v-if="p.number" class="circled">{{ p.number }}</span>
                        <span v-if="p.kind === 'article'" class="post-kind">✦ Статья</span>
                        <span v-if="p.kind === 'article'" class="dot">·</span>
                        <b>{{ author.name }}</b><span class="dot">·</span>
                        <span class="muted">@{{ author.handle }}</span><span class="dot">·</span>
                        <span class="muted">{{ p.ago }}</span>
                    </div>
                    <template v-if="p.kind === 'article'">
                        <div class="ap-title">{{ p.title }}</div>
                        <div class="ap-excerpt">{{ excerpt(p) }}…</div>
                    </template>
                    <p v-else class="post-body">{{ p.body }}</p>
                    <div class="react">
                        <span class="react-btn"><span class="glyph">✶</span> {{ p.up }}</span>
                        <span class="react-btn">↳ {{ p.replies }}</span>
                    </div>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
.authorpage { padding-bottom: 40px; }

.hero { background: var(--hero); border-bottom: 1px solid var(--border); padding: clamp(20px, 5vw, 44px) 0 clamp(24px, 5vw, 40px); }
.hero-in { position: relative; }
.back {
    display: inline-grid; place-items: center; width: 38px; height: 38px; margin-bottom: 18px;
    border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; color: var(--text); font-size: 16px;
}
.hero-top { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.hero-av {
    display: grid; place-items: center; width: 88px; height: 88px; flex: none; border-radius: 50%;
    background: var(--p); color: #fff; font-family: var(--f-mono); font-size: 30px; font-weight: 600;
    box-shadow: 0 8px 30px -6px rgba(195, 33, 120, .6);
}
.hero-info { flex: 1; min-width: 220px; }
.hero-name { display: flex; align-items: center; gap: 10px; font-size: clamp(24px, 5vw, 34px); flex-wrap: wrap; }
.kind-badge {
    font-family: var(--f-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--text-2); background: rgba(255, 255, 255, .08); padding: 3px 9px; border-radius: 6px;
}
.hero-handle { font-family: var(--f-mono); font-size: 14px; color: var(--text-2); margin-top: 4px; }
.hero-bio { margin: 12px 0 0; font-size: 15px; line-height: 1.55; max-width: 560px; color: var(--text); }
.hero-stats { display: flex; gap: 22px; margin-top: 16px; font-size: 13.5px; color: var(--text-2); }
.hero-stats b { color: var(--text); font-family: var(--f-mono); font-size: 16px; }
.hero-actions { display: flex; flex-direction: column; gap: 8px; }
.hero-actions .btn.on { background: var(--p); border-color: var(--p); color: #fff; }

.body { margin-top: 22px; }
.empty { padding: 40px 0; text-align: center; }
.feed { display: flex; flex-direction: column; gap: 14px; max-width: 720px; }
.post { display: block; padding: 16px 18px; color: inherit; transition: border-color .15s; }
.post:hover { border-color: var(--p); }
.post-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13.5px; }
.post-meta .dot { color: var(--muted); }
.post-kind { font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--p); }
.circled {
    display: grid; place-items: center; width: 26px; height: 26px; flex: none; border: 2px solid var(--p);
    border-radius: 50%; color: var(--p); font-family: var(--f-mono); font-weight: 700; font-size: 12px;
}
.post-body { margin: 10px 0 0; font-size: 15px; line-height: 1.6; }
.post.spark .post-body { font-family: var(--f-display); font-size: 20px; line-height: 1.4; }
.post.line .post-body { font-family: var(--f-display); font-size: 22px; font-weight: 700; }
.ap-title { margin-top: 10px; font-family: var(--f-display); font-size: 19px; font-weight: 700; }
.ap-excerpt { margin-top: 6px; font-size: 14px; color: var(--text-2); line-height: 1.55; }
.react { display: flex; gap: 14px; margin-top: 12px; }
.react-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--text-2); }
.react-btn .glyph { color: var(--p); }
</style>
