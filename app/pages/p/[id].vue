<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Одиночный пост + тред комментариев (порт /p/:id из StayInspired). */

interface FeedMedia { type: 'image' | 'video'; label: string }
interface FeedReply { author: string; handle: string; ago: string; body: string }
interface FeedPost {
    id: string; kind: 'spark' | 'note' | 'article' | 'line' | 'thread'
    author: string; handle: string; ago: string; number?: number
    title?: string; body?: string; excerpt?: string; content?: string[]
    media?: FeedMedia; reply?: FeedReply; up: number; replies: number
}

const route = useRoute()
const localePath = useLocalePath()
const { user } = useAuth()
const { toast } = useToast()

const { data, error } = await useFetch<{ post: FeedPost; thread: FeedReply[] }>(
    () => `/api/feed/${route.params.id}`)

if (error.value) throw createError({ statusCode: 404, statusMessage: 'Пост не найден', fatal: true })

const post = computed(() => data.value!.post)
const replies = ref<FeedReply[]>([...(data.value?.thread ?? [])])

useSeoMeta({
    title: () => (post.value.kind === 'article' ? post.value.title : `${post.value.author} — Dustore`),
})

function initials(n: string) { return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }

/* реакции */
const resonated = ref(false)
const saved = ref(false)
const up = computed(() => post.value.up + (resonated.value ? 1 : 0))
function resonate() { resonated.value = !resonated.value; if (resonated.value) toast('Отзывается ✶', 'ok') }
function share() {
    const url = location.origin + localePath(`/p/${post.value.id}`)
    navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована', 'ok'), () => toast(url))
}

/* ответ */
const draft = ref('')
function postReply() {
    const t = draft.value.trim()
    if (!t) { toast('Напишите ответ'); return }
    replies.value.push({
        author: user.value?.displayName || user.value?.nick || 'Гость',
        handle: user.value ? '@' + user.value.nick : '@guest',
        ago: 'только что', body: t,
    })
    draft.value = ''
    toast('Ответ опубликован ✦', 'ok')
}
</script>

<template>
    <div class="wrap postpage">
        <div class="single-topbar">
            <NuxtLink :to="localePath('/feed')" class="ov-icon" aria-label="К ленте">←</NuxtLink>
            <span class="ov-meta">
                {{ post.kind === 'article' ? 'Статья' : 'Пост' }}
            </span>
            <div class="ov-actions">
                <button class="ov-icon" :class="{ on: saved }" @click="saved = !saved; toast(saved ? 'Сохранено' : 'Убрано')">⌸</button>
                <button class="ov-icon" @click="share">⤴</button>
            </div>
        </div>

        <article class="card post single" :class="post.kind">
            <div class="post-meta">
                <span v-if="post.number" class="circled">{{ post.number }}</span>
                <span v-if="post.kind === 'article'" class="post-kind">✦ Статья</span>
                <span v-if="post.kind === 'article'" class="dot">·</span>
                <AuthorLink :handle="post.handle"><b>{{ post.author }}</b></AuthorLink>
                <span class="dot">·</span>
                <AuthorLink :handle="post.handle" class="muted">{{ post.handle }}</AuthorLink>
                <span class="dot">·</span><span class="muted">{{ post.ago }}</span>
            </div>

            <template v-if="post.kind === 'article'">
                <h1 class="single-title">{{ post.title }}</h1>
                <div class="byline">
                    <span class="ava">{{ initials(post.author) }}</span>
                    <div>
                        <div class="by-name">{{ post.author }}</div>
                        <div class="by-detail muted">{{ post.handle }} · {{ post.ago }}</div>
                    </div>
                </div>
                <div class="article-content">
                    <p v-for="(par, i) in post.content" :key="i">{{ par }}</p>
                </div>
            </template>
            <template v-else>
                <p class="post-body">{{ post.body }}</p>
                <div v-if="post.media" class="post-media" :class="post.media.type">
                    <span class="media-lbl">{{ post.media.label }}</span>
                    <span v-if="post.media.type === 'video'" class="play-btn">▶</span>
                </div>
                <div v-if="post.reply" class="reply-thread">
                    <div class="post-meta">
                        <AuthorLink :handle="post.reply.handle"><b>{{ post.reply.author }}</b></AuthorLink>
                        <span class="dot">·</span><span class="muted">{{ post.reply.handle }}</span>
                    </div>
                    <p class="post-body">{{ post.reply.body }}</p>
                </div>
            </template>

            <div class="react">
                <button class="react-btn" :class="{ on: resonated }" @click="resonate">
                    <span class="glyph">✶</span> {{ up }} отзывается
                </button>
                <button class="react-btn" @click="saved = !saved; toast(saved ? 'Сохранено' : 'Убрано')">
                    ⤴ {{ saved ? 'Сохранено' : 'Сохранить' }}
                </button>
            </div>
        </article>

        <!-- тред -->
        <section class="thread">
            <h3 class="thread-h">Ответы <span class="thread-n">{{ replies.length }}</span></h3>
            <div class="thread-list">
                <div v-for="(r, i) in replies" :key="i" class="thread-item">
                    <span class="ti-av">{{ initials(r.author) }}</span>
                    <div class="ti-body">
                        <div class="ti-meta">
                            <AuthorLink :handle="r.handle"><b>{{ r.author }}</b></AuthorLink>
                            <span class="dot">·</span><span class="muted">{{ r.handle }}</span>
                            <span class="dot">·</span><span class="muted">{{ r.ago }}</span>
                        </div>
                        <p class="ti-text">{{ r.body }}</p>
                    </div>
                </div>
                <p v-if="!replies.length" class="thread-empty muted">Пока нет ответов. Будьте первым.</p>
            </div>

            <div class="reply-box">
                <textarea v-model="draft" rows="1" placeholder="Написать ответ…"
                    @keydown.enter.exact.prevent="postReply" />
                <button class="btn btn--primary btn--sm" @click="postReply">Ответить</button>
            </div>
        </section>
    </div>
</template>

<style scoped>
.postpage { max-width: 720px; padding-block: clamp(16px, 4vw, 28px); }

.single-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ov-icon {
    display: grid; place-items: center; width: 38px; height: 38px; flex: none;
    border: 1px solid var(--border); border-radius: 10px; background: none; color: var(--text); font-size: 16px;
}
.ov-icon.on { border-color: var(--p); color: var(--p); }
.ov-meta { font-family: var(--f-mono); font-size: 12px; color: var(--muted); }
.ov-actions { margin-left: auto; display: flex; gap: 8px; }

.post.single { padding: 20px 22px; }
.post-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; }
.post-meta .dot { color: var(--muted); }
.post-kind { font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--p); }
.circled {
    display: grid; place-items: center; width: 26px; height: 26px; flex: none;
    border: 2px solid var(--p); border-radius: 50%; color: var(--p); font-family: var(--f-mono); font-weight: 700; font-size: 12px;
}
.post-body { margin: 14px 0 0; font-size: 16px; line-height: 1.65; }
.post.spark .post-body { font-family: var(--f-display); font-size: 24px; line-height: 1.35; }
.post.line .post-body { font-family: var(--f-display); font-size: 26px; font-weight: 800; }

.single-title { margin: 14px 0 0; font-size: clamp(26px, 5vw, 40px); line-height: 1.15; }
.byline { display: flex; align-items: center; gap: 10px; margin: 16px 0 24px; }
.ava {
    display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 50%;
    background: var(--p); color: #fff; font-family: var(--f-mono); font-size: 13px; font-weight: 600;
}
.by-name { font-weight: 600; font-size: 14px; }
.by-detail { font-size: 12.5px; }
.article-content { font-size: 17px; line-height: 1.75; }
.article-content p { margin: 0 0 20px; }

.post-media {
    position: relative; margin-top: 14px; width: 100%; aspect-ratio: 16/9; border-radius: var(--r-sm);
    display: grid; place-items: center; overflow: hidden;
}
.post-media.image { background: var(--surf-2); border: 1px solid var(--border); }
.post-media.video { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); }
.media-lbl { font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.play-btn {
    position: absolute; inset: 0; margin: auto; width: 54px; height: 54px; display: grid; place-items: center;
    border-radius: 50%; background: rgba(0, 0, 0, .5); color: #fff; font-size: 18px;
}
.reply-thread {
    margin-top: 14px; padding: 10px 12px; border-left: 2px solid var(--p);
    background: rgba(255, 255, 255, .03); border-radius: 0 var(--r-sm) var(--r-sm) 0;
}
.reply-thread .post-body { margin-top: 4px; font-size: 14px; }

.react { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
.react-btn {
    display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px;
    border: 1px solid var(--border); border-radius: 99px; background: none; color: var(--text-2); font-size: 13px;
}
.react-btn:hover { border-color: var(--p); color: #fff; }
.react-btn.on { background: color-mix(in srgb, var(--p) 22%, transparent); border-color: var(--p); color: #fff; }
.react-btn .glyph { color: var(--p); }

.thread { margin-top: 26px; }
.thread-h { font-family: var(--f-display); font-size: 18px; margin-bottom: 16px; }
.thread-n { color: var(--p); font-family: var(--f-mono); }
.thread-list { display: flex; flex-direction: column; gap: 16px; }
.thread-item { display: flex; gap: 12px; }
.ti-av {
    display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: 50%;
    background: var(--surf-2); color: var(--text-2); font-family: var(--f-mono); font-size: 11px;
}
.ti-body { flex: 1; min-width: 0; }
.ti-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; }
.ti-meta .dot { color: var(--muted); }
.ti-text { margin: 4px 0 0; font-size: 14.5px; line-height: 1.55; }
.thread-empty { padding: 20px 0; text-align: center; font-size: 14px; }

.reply-box {
    display: flex; align-items: flex-end; gap: 10px; margin-top: 20px; padding: 10px 10px 10px 14px;
    background: var(--surf); border: 1px solid var(--border); border-radius: var(--r-lg);
}
.reply-box textarea {
    flex: 1; max-height: 120px; resize: none; background: none; border: none; outline: none;
    color: var(--text); font: inherit; font-size: 14.5px; line-height: 1.5; padding: 6px 0;
}
.reply-box textarea::placeholder { color: var(--muted); }
</style>
