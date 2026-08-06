<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'

/**
 * Лента вдохновения — порт раздела StayInspired под тёмную тему Dustore.
 * Данные приходят из /api/feed (таблица feed_posts либо сид без базы).
 */

interface FeedMedia { type: 'image' | 'video'; label: string }
interface FeedReply { author: string; handle: string; ago: string; body: string }
interface FeedPost {
    id: string
    kind: 'spark' | 'note' | 'article' | 'line' | 'thread'
    author: string
    handle: string
    ago: string
    number?: number
    title?: string
    body?: string
    excerpt?: string
    content?: string[]
    media?: FeedMedia
    reply?: FeedReply
    up: number
    replies: number
}

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()
const { toast } = useToast()

useSeoMeta({ title: () => `${t('feed.title')} — Dustore` })

const { data, refresh } = await useFetch<{ posts: FeedPost[] }>('/api/feed')
const posts = computed<FeedPost[]>(() => data.value?.posts ?? [])

const myInitials = computed(() =>
    user.value ? user.value.nick.slice(0, 2).toUpperCase() : '?')
const myName = computed(() => user.value?.displayName || user.value?.nick || 'Гость')
const myHandle = computed(() => user.value ? '@' + user.value.nick : '@guest')

function initials(name: string) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── локальные реакции (в памяти сессии) ── */
const resonated = reactive<Record<string, boolean>>({})
const bump = reactive<Record<string, number>>({})
const saved = reactive<Record<string, boolean>>({})

function upCount(p: FeedPost) { return p.up + (bump[p.id] || 0) }
function toggleResonate(p: FeedPost) {
    if (resonated[p.id]) { resonated[p.id] = false; bump[p.id] = (bump[p.id] || 0) - 1 }
    else { resonated[p.id] = true; bump[p.id] = (bump[p.id] || 0) + 1; toast('Отзывается ✶', 'ok') }
}
function toggleSave(p: FeedPost) {
    saved[p.id] = !saved[p.id]
    toast(saved[p.id] ? 'Сохранено в закладки' : 'Убрано из закладок')
}

/* ── меню поста ── */
const openMenu = ref<string | null>(null)
function menu(id: string) { openMenu.value = openMenu.value === id ? null : id }
function share(p: FeedPost) {
    const url = `${location.origin}${localePath('/feed')}#${p.id}`
    navigator.clipboard?.writeText(url).then(
        () => toast('Ссылка скопирована', 'ok'),
        () => toast('Ссылка: ' + url))
    openMenu.value = null
}
if (import.meta.client) {
    window.addEventListener('click', () => { openMenu.value = null })
}

/* ── табы ── */
const tabs = ['Все', 'В резонансе', 'Читаемые']
const activeTab = ref(0)
function pickTab(i: number) { activeTab.value = i; toast(tabs[i]!) }

const shown = computed(() => {
    if (activeTab.value === 1) return [...posts.value].sort((a, b) => upCount(b) - upCount(a))
    if (activeTab.value === 2) return posts.value.filter(p => p.kind === 'article' || p.kind === 'thread')
    return posts.value
})

/* ── режим листания (Reels) ── */
const flip = ref(false)

/* ── открыть пост со страницей комментариев /p/:id ── */
function openPost(p: FeedPost) { navigateTo(localePath(`/p/${p.id}`)) }
function onPostClick(e: MouseEvent, p: FeedPost) {
    const t = e.target as Element | null
    if (t?.closest('.react, .post-menu-wrap, .article-preview, a, button, textarea, input')) return
    openPost(p)
}

/* ── композер ── */
const composeText = ref('')
const UP_CHARS = 180
const showUpgrade = computed(() => composeText.value.length >= UP_CHARS)
const charsLeft = computed(() => 400 - composeText.value.length)
const publishing = ref(false)

async function publishPost() {
    const text = composeText.value.trim()
    if (!text) { toast('Напишите что-нибудь вдохновляющее ✦'); return }
    if (!user.value) { toast('Войдите, чтобы публиковать', 'err'); return }
    publishing.value = true
    try {
        await $fetch('/api/feed', { method: 'POST', body: { kind: 'note', body: text } })
        composeText.value = ''
        await refresh()
        toast('Опубликовано ✦', 'ok')
    } catch (e: any) {
        toast(errText(e), 'err')
    } finally { publishing.value = false }
}

function errText(e: any) {
    const code = e?.data?.statusMessage || e?.statusMessage
    if (code === 'NOT_AUTHED') return 'Войдите, чтобы публиковать'
    if (code === 'EMPTY') return 'Пустой пост'
    return 'Не удалось опубликовать'
}

/* ── ридер статьи ── */
const reader = ref<FeedPost | null>(null)
function openArticle(p: FeedPost) { reader.value = p; lockScroll(true) }
function closeArticle() { reader.value = null; lockScroll(false) }

/* ── редактор статьи ── */
const edOpen = ref(false)
const edTitle = ref('')
const edContent = ref('')
const edTags = ref<string[]>([])
const tagInput = ref('')
const edStatus = ref('Черновик')
const edContentEl = ref<HTMLTextAreaElement | null>(null)
let autoSaveT: any = null

function openEditor(prefill = '') {
    edOpen.value = true
    if (prefill) edContent.value = prefill
    lockScroll(true)
}
function closeEditor() { edOpen.value = false; lockScroll(false) }
function openEditorFromCompose() { openEditor(composeText.value.trim()) }

function scheduleAutoSave() {
    edStatus.value = 'Черновик…'
    clearTimeout(autoSaveT)
    autoSaveT = setTimeout(() => {
        edStatus.value = 'Сохранён · ' + new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    }, 1500)
}
watch([edTitle, edContent], scheduleAutoSave)

function addTag(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const v = tagInput.value.trim().replace(/^#/, '')
    if (v && !edTags.value.includes(v)) edTags.value.push(v)
    tagInput.value = ''
}
function removeTag(i: number) { edTags.value.splice(i, 1) }

/* ── статистика редактора ── */
const stats = computed(() => {
    const title = edTitle.value, content = edContent.value
    const words = (title + ' ' + content).trim().split(/\s+/).filter(Boolean).length
    const chars = content.length
    const paras = content.split(/\n\n+/).filter(p => p.trim()).length || (content.trim() ? 1 : 0)
    const readMin = Math.max(1, Math.round(words / 200))
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 3)
    const avgSent = sentences.length ? words / sentences.length : 0
    const longSents = sentences.filter(s => s.trim().split(/\s+/).length > 20).length
    const allW = content.trim().split(/\s+/).filter(Boolean)
    const avgWL = allW.length
        ? allW.reduce((s, w) => s + w.replace(/[^а-яёa-z]/gi, '').length, 0) / allW.length : 0

    let rs = words > 0 ? 100 : 0
    if (avgSent > 20) rs -= 20
    if (avgSent > 30) rs -= 15
    if (avgWL > 6) rs -= 10
    if (longSents > 3) rs -= 15
    rs = Math.max(0, Math.min(100, rs))

    let seo = 0; const tips: string[] = []
    if (title.length >= 10) seo += 25; else tips.push('Заголовок слишком короткий.')
    if (title.length <= 60) seo += 10; else tips.push('Заголовок длиннее 60 символов.')
    if (chars >= 300) seo += 25; else tips.push('Добавьте больше текста (мин. 300 симв.).')
    if (chars >= 1000) seo += 15
    if (paras >= 3) seo += 15; else tips.push('Разбейте текст на абзацы.')
    if (edTags.value.length >= 2) seo += 10; else tips.push('Добавьте хотя бы 2 тега.')
    seo = Math.min(100, seo)

    return {
        words, chars, paras, readMin, longSents,
        avgWL: allW.length ? avgWL.toFixed(1) : '—',
        readScore: rs,
        readLabel: words === 0 ? 'Начните писать'
            : rs >= 75 ? 'Читается легко' : rs >= 50 ? 'Средняя сложность' : 'Сложно — упростите',
        seo,
        seoLabel: seo < 40 ? 'слабый' : seo < 70 ? 'средний' : 'хороший',
        seoColor: seo < 40 ? 'var(--err)' : seo < 70 ? 'var(--warn)' : 'var(--ok)',
        tip: tips.length ? tips[0] : 'Отлично! Статья хорошо оптимизирована.',
    }
})
const SEO_CIRC = 213.6
const seoOffset = computed(() => SEO_CIRC - (SEO_CIRC * stats.value.seo / 100))

/* ── тулбар редактора (markdown вокруг выделения) ── */
function edFormat(kind: string) {
    const ta = edContentEl.value
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd, val = ta.value
    const sel = val.slice(s, e), before = val.slice(0, s), after = val.slice(e)
    let out = val, cursor = e
    const wrap = (a: string, b: string, ph: string) => { const x = sel || ph; out = before + a + x + b + after; cursor = before.length + a.length + x.length }
    const pre = (p: string, ph: string) => { const x = sel || ph; out = before + p + x + after; cursor = before.length + p.length + x.length }
    switch (kind) {
        case 'bold': wrap('**', '**', 'текст'); break
        case 'italic': wrap('*', '*', 'текст'); break
        case 'code': sel.includes('\n') ? wrap('\n```\n', '\n```\n', 'код') : wrap('`', '`', 'код'); break
        case 'link': { const x = sel || 'текст'; out = before + '[' + x + '](https://)' + after; cursor = (before + '[' + x + '](https://').length; break }
        case 'h2': pre('## ', 'Заголовок'); break
        case 'quote': pre('> ', 'Цитата'); break
        case 'list': pre('- ', 'Пункт списка'); break
        case 'image': { const ins = '![подпись](https://)'; out = before + ins + after; cursor = before.length + ins.length; break }
        case 'hr': { const ins = (before && !before.endsWith('\n') ? '\n' : '') + '\n---\n'; out = before + ins + after; cursor = before.length + ins.length; break }
        default: return
    }
    edContent.value = out
    nextTick(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) })
}

async function publishArticle() {
    const title = edTitle.value.trim(), text = edContent.value.trim()
    if (!title) { toast('Добавьте заголовок'); return }
    if (text.length < 50) { toast('Статья слишком короткая'); return }
    if (!user.value) { toast('Войдите, чтобы публиковать', 'err'); return }
    try {
        await $fetch('/api/feed', { method: 'POST', body: { kind: 'article', title, content: text } })
        closeEditor()
        edTitle.value = ''; edContent.value = ''; edTags.value = []
        composeText.value = ''
        await refresh()
        toast('Статья опубликована ✦', 'ok')
    } catch (e: any) { toast(errText(e), 'err') }
}
function saveDraft() {
    edStatus.value = 'Черновик сохранён · ' + new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    toast('Черновик сохранён')
}

/* ── follow в сайдбаре ── */
const following = reactive<Record<string, boolean>>({})
function toggleFollow(h: string) { following[h] = !following[h] }

const whoToRead = [
    { name: 'Ирис Кан', handle: '@iris' },
    { name: 'Лука Мор', handle: '@luka' },
    { name: 'Эва Рейн', handle: '@evarain' },
]
const trends = [
    { q: 'Что вы выбросили — и стало легче?', n: '128 голосов' },
    { q: 'Лучший совет не от человека?', n: '94 голоса' },
    { q: 'Рабочее место в одном кадре.', n: '210 голосов' },
]

function lockScroll(on: boolean) {
    if (import.meta.client) document.body.style.overflow = on ? 'hidden' : ''
}
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { closeArticle(); closeEditor() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => { window.removeEventListener('keydown', onKey); lockScroll(false) })
</script>

<template>
    <div class="wrap feedpage">
        <div class="app-grid">
            <!-- ══════ MAIN ══════ -->
            <main class="main-col">
                <div class="eyebrow feed-eyebrow">{{ t('feed.today') }}</div>

                <!-- COMPOSE -->
                <section class="card compose">
                    <div class="compose-row">
                        <span class="ava">{{ myInitials }}</span>
                        <textarea v-model="composeText" class="compose-ta" rows="1"
                            :placeholder="t('feed.composePlaceholder')" maxlength="400" />
                    </div>
                    <Transition name="fade">
                        <div v-if="showUpgrade" class="upgrade-hint">
                            <span>✦</span>
                            <span>Похоже на <strong>статью</strong> — открыть редактор?</span>
                            <button class="uh-btn" @click="openEditorFromCompose">Редактор</button>
                        </div>
                    </Transition>
                    <div class="compose-foot">
                        <div class="compose-tools">
                            <button class="ctool" title="Изображение" @click="toast('Прикрепить изображение')">🖼</button>
                            <button class="ctool" title="Ссылка" @click="toast('Вставить ссылку')">🔗</button>
                            <button class="ctool" title="Теги" @click="toast('Добавить теги')">✦</button>
                        </div>
                        <span class="char-cnt" :class="{ warn: charsLeft < 40 }">{{ charsLeft }}</span>
                        <button class="btn btn--primary btn--sm" :disabled="publishing" @click="publishPost">
                            {{ t('feed.publish') }}
                        </button>
                    </div>
                </section>

                <!-- TOOLBAR -->
                <div class="feed-toolbar">
                    <div class="feed-tabs">
                        <button v-for="(tb, i) in tabs" :key="tb" class="feed-tab" :class="{ active: activeTab === i }"
                            @click="pickTab(i)">{{ tb }}</button>
                    </div>
                    <div class="mode-switch" role="group" aria-label="Режим ленты">
                        <button class="ms-btn" :class="{ active: !flip }" @click="flip = false">≡ Лента</button>
                        <button class="ms-btn" :class="{ active: flip }" @click="flip = true">⧉ Листание</button>
                    </div>
                </div>

                <!-- FEED -->
                <div v-if="!flip" class="feed">
                    <article v-for="p in shown" :id="p.id" :key="p.id" class="card post is-clickable"
                        :class="p.kind" @click="onPostClick($event, p)">
                        <div class="post-header">
                            <div class="post-meta">
                                <span v-if="p.number" class="circled">{{ p.number }}</span>
                                <span v-if="p.kind === 'article'" class="post-kind">✦ Статья</span>
                                <span v-if="p.kind === 'article'" class="dot">·</span>
                                <AuthorLink :handle="p.handle"><b>{{ p.author }}</b></AuthorLink>
                                <span class="dot">·</span>
                                <AuthorLink :handle="p.handle" class="muted">{{ p.handle }}</AuthorLink>
                                <span class="dot">·</span>
                                <span class="muted">{{ p.ago }}</span>
                            </div>
                            <div class="post-menu-wrap" @click.stop>
                                <button class="post-menu-btn" aria-label="Меню" @click="menu(p.id)">···</button>
                                <div v-if="openMenu === p.id" class="post-dropdown">
                                    <button class="pd-item" @click="share(p)">🔗 Поделиться ссылкой</button>
                                    <button class="pd-item" @click="toast('Форма ответа скоро')">↩ Написать ответ</button>
                                    <button class="pd-item danger" @click="toast('Жалоба отправлена'); openMenu = null">⚑
                                        Пожаловаться</button>
                                </div>
                            </div>
                        </div>

                        <!-- тело по типу -->
                        <template v-if="p.kind === 'article'">
                            <div class="article-preview" @click="openArticle(p)">
                                <div class="ap-title">{{ p.title }}</div>
                                <div class="ap-excerpt">{{ p.excerpt }}</div>
                            </div>
                        </template>
                        <template v-else>
                            <p class="post-body">{{ p.body }}</p>
                        </template>

                        <!-- медиа -->
                        <div v-if="p.media" class="post-media">
                            <div v-if="p.media.type === 'image'" class="media-ph">
                                <div class="media-ic">🖼</div>
                                <div class="media-lbl">{{ p.media.label }}</div>
                            </div>
                            <div v-else class="media-video" @click="toast('Видео — скоро ▶')">
                                <div class="media-lbl">{{ p.media.label }}</div>
                                <div class="play-btn">▶</div>
                            </div>
                        </div>

                        <!-- встроенная ветка -->
                        <div v-if="p.reply" class="reply-thread">
                            <div class="post-meta">
                                <AuthorLink :handle="p.reply.handle"><b>{{ p.reply.author }}</b></AuthorLink>
                                <span class="dot">·</span>
                                <span class="muted">{{ p.reply.handle }}</span><span class="dot">·</span>
                                <span class="muted">{{ p.reply.ago }}</span>
                            </div>
                            <p class="post-body">{{ p.reply.body }}</p>
                        </div>

                        <!-- реакции -->
                        <div class="react">
                            <button class="react-btn" :class="{ on: resonated[p.id] }" @click="toggleResonate(p)">
                                <span class="glyph">✶</span> {{ upCount(p) }} отзывается
                            </button>
                            <button class="react-btn" @click="p.kind === 'article' ? openArticle(p) : openPost(p)">
                                <template v-if="p.kind === 'article'">→ Читать</template>
                                <template v-else>↳ {{ p.replies }}</template>
                            </button>
                            <button class="react-btn" :class="{ on: saved[p.id] }" @click="toggleSave(p)">
                                ⤴ {{ saved[p.id] ? 'Сохранено' : 'Сохранить' }}
                            </button>
                        </div>
                    </article>
                </div>

                <!-- FLIP MODE (Reels) -->
                <ClientOnly>
                    <FlipReels v-if="flip" :posts="shown" :resonated="resonated" :bump="bump" :start-index="0"
                        @close="flip = false" @resonate="toggleResonate" @open="openPost" />
                </ClientOnly>
            </main>

            <!-- ══════ ASIDE ══════ -->
            <aside class="aside-col">
                <button class="btn btn--primary write-cta" @click="openEditor()">✎ {{ t('feed.writeArticle') }}</button>

                <div class="card aside-block">
                    <h3>Кого почитать</h3>
                    <div v-for="w in whoToRead" :key="w.handle" class="who">
                        <span class="who-av">{{ initials(w.name) }}</span>
                        <div class="who-i">
                            <div class="who-name">{{ w.name }}</div>
                            <div class="who-handle muted">{{ w.handle }}</div>
                        </div>
                        <button class="follow-btn" :class="{ on: following[w.handle] }" @click="toggleFollow(w.handle)">
                            {{ following[w.handle] ? 'Читаю' : 'Читать' }}
                        </button>
                    </div>
                </div>

                <div class="card aside-block">
                    <h3>Ветки в резонансе</h3>
                    <button v-for="tr in trends" :key="tr.q" class="trend" @click="toast('Открытия скоро')">
                        <div class="trend-q">{{ tr.q }}</div>
                        <div class="trend-n muted">{{ tr.n }}</div>
                    </button>
                </div>

                <p class="aside-footer muted">StayInspired × Dustore © 2026</p>
            </aside>
        </div>

        <!-- ══════ РИДЕР СТАТЬИ ══════ -->
        <Transition name="slide">
            <div v-if="reader" class="overlay reader">
                <div class="ov-topbar">
                    <button class="ov-icon" @click="closeArticle">←</button>
                    <span class="ov-meta">Статья · {{ Math.max(1, Math.round((reader.content?.join(' ').split(/\s+/).length || 0) / 200)) }} мин</span>
                    <div class="ov-actions">
                        <button class="ov-icon" @click="toast('Сохранено')">⌸</button>
                        <button class="ov-icon" @click="share(reader)">⤴</button>
                    </div>
                </div>
                <div class="ov-body">
                    <article class="ov-article">
                        <h1 class="ov-title">{{ reader.title }}</h1>
                        <div class="ov-byline">
                            <span class="ava">{{ initials(reader.author) }}</span>
                            <div>
                                <div class="by-name">{{ reader.author }}</div>
                                <div class="by-detail muted">{{ reader.handle }} · {{ reader.ago }}</div>
                            </div>
                        </div>
                        <div class="ov-content">
                            <p v-for="(para, i) in reader.content" :key="i">{{ para }}</p>
                        </div>
                    </article>
                </div>
            </div>
        </Transition>

        <!-- ══════ РЕДАКТОР СТАТЬИ ══════ -->
        <Transition name="slide">
            <div v-if="edOpen" class="overlay editor">
                <div class="ov-topbar editor-top">
                    <span class="ed-logo">Написать статью</span>
                    <span class="ed-status muted">{{ edStatus }}</span>
                    <div class="ov-actions">
                        <button class="btn btn--sm" @click="closeEditor">Отмена</button>
                        <button class="btn btn--sm" @click="saveDraft">Черновик</button>
                        <button class="btn btn--primary btn--sm" @click="publishArticle">Опубликовать</button>
                    </div>
                </div>
                <div class="editor-body">
                    <div class="editor-write">
                        <textarea v-model="edTitle" class="editor-title" rows="1"
                            placeholder="Заголовок статьи…" maxlength="120" />
                        <div class="editor-divider"><span>текст</span></div>
                        <div class="editor-toolbar">
                            <button class="tb-btn" title="Жирный" @click="edFormat('bold')"><b>B</b></button>
                            <button class="tb-btn" title="Курсив" @click="edFormat('italic')"><i>I</i></button>
                            <button class="tb-btn" title="Ссылка" @click="edFormat('link')">↗</button>
                            <span class="tb-sep" />
                            <button class="tb-btn" title="H2" @click="edFormat('h2')">H₂</button>
                            <button class="tb-btn" title="Цитата" @click="edFormat('quote')">"</button>
                            <button class="tb-btn" title="Код" @click="edFormat('code')">{ }</button>
                            <span class="tb-sep" />
                            <button class="tb-btn" title="Список" @click="edFormat('list')">≡</button>
                            <button class="tb-btn" title="Изображение" @click="edFormat('image')">🖼</button>
                            <button class="tb-btn" title="Разделитель" @click="edFormat('hr')">—</button>
                        </div>
                        <textarea ref="edContentEl" v-model="edContent" class="editor-content" rows="12"
                            placeholder="Начните писать здесь. Хорошее повествование начинается с конкретной детали…" />
                    </div>

                    <div class="editor-stats">
                        <div class="estat-block">
                            <h4>SEO</h4>
                            <div class="seo-ring">
                                <svg viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" stroke-width="6" />
                                    <circle cx="40" cy="40" r="34" fill="none" :stroke="stats.seoColor" stroke-width="6"
                                        stroke-linecap="round" :stroke-dasharray="SEO_CIRC" :stroke-dashoffset="seoOffset"
                                        transform="rotate(-90 40 40)" style="transition:stroke-dashoffset .5s,stroke .5s" />
                                </svg>
                                <div class="seo-num">{{ stats.seo }}</div>
                                <div class="seo-lbl muted">{{ stats.seoLabel }}</div>
                            </div>
                            <div class="seo-tip muted">{{ stats.tip }}</div>
                        </div>

                        <div class="estat-block">
                            <h4>Статистика</h4>
                            <div class="estat-row"><span class="muted">Символов</span><span>{{ stats.chars }}</span></div>
                            <div class="estat-row"><span class="muted">Слов</span><span>{{ stats.words }}</span></div>
                            <div class="estat-row"><span class="muted">Абзацев</span><span>{{ stats.paras || '—' }}</span></div>
                            <div class="estat-row"><span class="muted">Чтение</span><span>{{ stats.words ? stats.readMin + ' мин' : '—' }}</span></div>
                        </div>

                        <div class="estat-block">
                            <h4>Читаемость</h4>
                            <div class="readab-bar-wrap"><div class="readab-bar" :style="{ width: stats.readScore + '%' }" /></div>
                            <div class="readab-label muted">{{ stats.readLabel }}</div>
                            <div class="estat-row" style="margin-top:8px">
                                <span class="muted">Длинные предл.</span><span>{{ stats.longSents || '—' }}</span>
                            </div>
                            <div class="estat-row"><span class="muted">Ср. слово</span><span>{{ stats.avgWL }}</span></div>
                        </div>

                        <div class="estat-block">
                            <h4>Теги</h4>
                            <input v-model="tagInput" class="tag-input" type="text" placeholder="Добавить тег…"
                                @keydown="addTag" />
                            <div class="tags-wrap">
                                <button v-for="(tg, i) in edTags" :key="tg" class="tag-chip" @click="removeTag(i)">
                                    #{{ tg }} ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.feedpage { padding-block: clamp(16px, 4vw, 32px); }

.app-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
@media (min-width: 900px) {
    .app-grid { grid-template-columns: minmax(0, 1fr) 300px; align-items: start; }
}

.feed-eyebrow { margin-bottom: 16px; }

/* ── COMPOSE ── */
.compose { padding: 16px; }
.compose-row { display: flex; gap: 12px; }
.ava {
    display: grid; place-items: center; width: 38px; height: 38px; flex: none;
    border-radius: 50%; background: var(--p); color: #fff;
    font-family: var(--f-mono); font-size: 12px; font-weight: 600;
}
.compose-ta {
    flex: 1; min-height: 40px; resize: none; background: none; border: none; outline: none;
    color: var(--text); font: inherit; font-size: 15px; line-height: 1.5; padding-top: 8px;
}
.compose-ta::placeholder { color: var(--muted); }
.upgrade-hint {
    display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 12px;
    background: color-mix(in srgb, var(--p) 12%, transparent);
    border: 1px solid var(--border); border-radius: var(--r-sm); font-size: 13px;
}
.uh-btn {
    margin-left: auto; padding: 5px 12px; border: 1px solid var(--p); border-radius: 7px;
    background: none; color: var(--p); font-size: 12px; font-weight: 600;
}
.compose-foot {
    display: flex; align-items: center; gap: 10px; margin-top: 12px;
    padding-top: 12px; border-top: 1px solid var(--border);
}
.compose-tools { display: flex; gap: 4px; }
.ctool {
    width: 34px; height: 34px; border-radius: 8px; background: none; border: none;
    color: var(--text-2); font-size: 15px;
}
.ctool:hover { background: rgba(255, 255, 255, .06); }
.char-cnt { margin-left: auto; font-family: var(--f-mono); font-size: 12px; color: var(--muted); }
.char-cnt.warn { color: var(--warn); }

/* ── TOOLBAR ── */
.feed-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin: 22px 0 14px; flex-wrap: wrap;
}
.feed-tabs, .mode-switch { display: flex; gap: 4px; }
.feed-tab {
    padding: 7px 14px; border-radius: 99px; background: none; border: 1px solid transparent;
    color: var(--text-2); font-size: 13px; font-weight: 500;
}
.feed-tab.active { background: color-mix(in srgb, var(--p) 20%, transparent); color: #fff; }
.mode-switch { padding: 3px; background: var(--surf); border: 1px solid var(--border); border-radius: 10px; }
.ms-btn {
    padding: 6px 12px; border-radius: 7px; background: none; border: none;
    color: var(--muted); font-size: 12.5px; font-weight: 600;
}
.ms-btn.active { background: var(--surf-2); color: #fff; }

/* ── FEED ── */
.feed { display: flex; flex-direction: column; gap: 14px; }
.post { padding: 16px 18px; }
.post-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.post-meta {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    font-size: 13.5px; color: var(--text);
}
.post-meta b { font-weight: 600; }
.post-meta .dot { color: var(--muted); }
.post-kind {
    font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--p);
}
.circled {
    display: grid; place-items: center; width: 26px; height: 26px; flex: none;
    border: 2px solid var(--p); border-radius: 50%; color: var(--p);
    font-family: var(--f-mono); font-weight: 700; font-size: 12px;
}
.post-menu-wrap { position: relative; flex: none; }
.post-menu-btn {
    width: 30px; height: 26px; border: none; background: none; color: var(--muted);
    letter-spacing: 1px; border-radius: 6px;
}
.post-menu-btn:hover { background: rgba(255, 255, 255, .06); color: #fff; }
.post-dropdown {
    position: absolute; top: 30px; right: 0; z-index: 20; width: 220px;
    display: flex; flex-direction: column; padding: 6px;
    background: var(--surf-2); border: 1px solid var(--border); border-radius: var(--r);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .5);
}
.pd-item {
    text-align: left; padding: 9px 10px; border: none; background: none; border-radius: 8px;
    color: var(--text); font-size: 13px;
}
.pd-item:hover { background: rgba(255, 255, 255, .06); }
.pd-item.danger { color: #ff9b9c; }

.post-body { margin: 10px 0 0; font-size: 15px; line-height: 1.6; }
.post.spark .post-body { font-family: var(--f-display); font-size: 20px; line-height: 1.4; }
.post.line .post-body { font-family: var(--f-display); font-size: 22px; font-weight: 700; }

.article-preview { margin-top: 10px; cursor: pointer; }
.ap-title { font-family: var(--f-display); font-size: 19px; font-weight: 700; }
.ap-excerpt { margin-top: 6px; font-size: 14px; color: var(--text-2); line-height: 1.55; }

.post-media { margin-top: 12px; }
.media-ph, .media-video {
    position: relative; width: 100%; aspect-ratio: 16/9; border-radius: var(--r-sm);
    display: grid; place-items: center; overflow: hidden;
}
.media-ph { background: var(--surf-2); border: 1px solid var(--border); }
.media-video { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); cursor: pointer; }
.media-ic { font-size: 34px; margin-bottom: 6px; }
.media-lbl {
    font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted); text-align: center;
}
.play-btn {
    position: absolute; inset: 0; margin: auto; width: 54px; height: 54px;
    display: grid; place-items: center; border-radius: 50%;
    background: rgba(0, 0, 0, .5); color: #fff; font-size: 18px;
}
.reply-thread {
    margin-top: 12px; padding: 10px 12px; border-left: 2px solid var(--p);
    background: rgba(255, 255, 255, .03); border-radius: 0 var(--r-sm) var(--r-sm) 0;
}
.reply-thread .post-body { margin-top: 4px; font-size: 14px; }

.react { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.react-btn {
    display: inline-flex; align-items: center; gap: 4px; padding: 7px 12px;
    border: 1px solid var(--border); border-radius: 99px; background: none;
    color: var(--text-2); font-size: 12.5px; transition: all .15s;
}
.react-btn:hover { border-color: var(--p); color: #fff; }
.react-btn.on { background: color-mix(in srgb, var(--p) 22%, transparent); border-color: var(--p); color: #fff; }
.react-btn .glyph { color: var(--p); }

/* пост кликабелен целиком → страница /p/:id (кроме кнопок/ссылок) */
.post.is-clickable { cursor: pointer; }

/* ── ASIDE ── */
.aside-col { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 14px; }
.write-cta { width: 100%; }
.aside-block { padding: 14px 16px; }
.aside-block h3 { font-family: var(--f-display); font-size: 15px; margin-bottom: 12px; }
.who { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.who-av {
    display: grid; place-items: center; width: 34px; height: 34px; flex: none;
    border-radius: 50%; background: var(--surf-2); color: var(--text-2);
    font-family: var(--f-mono); font-size: 11px;
}
.who-i { flex: 1; min-width: 0; }
.who-name { font-size: 13.5px; font-weight: 600; }
.who-handle { font-size: 11.5px; }
.follow-btn {
    padding: 5px 12px; border: 1px solid var(--border); border-radius: 99px;
    background: none; color: var(--text-2); font-size: 12px; font-weight: 600;
}
.follow-btn.on { background: var(--p); border-color: var(--p); color: #fff; }
.trend {
    display: block; width: 100%; text-align: left; padding: 9px 0; background: none; border: none;
    border-top: 1px solid var(--border);
}
.trend:first-of-type { border-top: none; }
.trend-q { font-size: 13.5px; line-height: 1.4; }
.trend-n { font-family: var(--f-mono); font-size: 11px; margin-top: 3px; }
.aside-footer { font-family: var(--f-mono); font-size: 11px; text-align: center; }

/* ── OVERLAYS ── */
.overlay {
    position: fixed; inset: 0; z-index: 200; background: var(--bg);
    display: flex; flex-direction: column;
}
.ov-topbar {
    display: flex; align-items: center; gap: 12px; padding: 12px clamp(16px, 4vw, 40px);
    border-bottom: 1px solid var(--border); background: var(--surf);
}
.ov-icon {
    width: 38px; height: 38px; flex: none; display: grid; place-items: center;
    border: 1px solid var(--border); border-radius: 10px; background: none;
    color: var(--text); font-size: 16px;
}
.ov-meta { font-family: var(--f-mono); font-size: 12px; color: var(--muted); }
.ov-actions { margin-left: auto; display: flex; gap: 8px; }
.ov-body { flex: 1; overflow-y: auto; padding: clamp(24px, 6vw, 64px) clamp(16px, 4vw, 40px); }
.ov-article { max-width: 680px; margin: 0 auto; }
.ov-title { font-size: clamp(26px, 5vw, 40px); line-height: 1.15; }
.ov-byline { display: flex; align-items: center; gap: 10px; margin: 18px 0 28px; }
.by-name { font-weight: 600; font-size: 14px; }
.by-detail { font-size: 12.5px; }
.ov-content { font-size: 17px; line-height: 1.75; }
.ov-content p { margin: 0 0 20px; }

/* ── EDITOR ── */
.editor-top { gap: 14px; }
.ed-logo { font-family: var(--f-brand); font-size: 18px; }
.ed-status { font-family: var(--f-mono); font-size: 12px; }
.editor-body {
    flex: 1; overflow-y: auto; display: grid; grid-template-columns: minmax(0, 1fr);
    gap: 24px; padding: clamp(20px, 4vw, 40px);
}
@media (min-width: 1000px) { .editor-body { grid-template-columns: minmax(0, 1fr) 300px; } }
.editor-write { max-width: 720px; }
.editor-title {
    width: 100%; resize: none; background: none; border: none; outline: none; color: var(--text);
    font-family: var(--f-display); font-size: clamp(24px, 4vw, 34px); font-weight: 700; line-height: 1.2;
}
.editor-title::placeholder { color: var(--muted); }
.editor-divider {
    display: flex; align-items: center; gap: 10px; margin: 18px 0;
    font-family: var(--f-mono); font-size: 10px; text-transform: uppercase;
    letter-spacing: .1em; color: var(--muted);
}
.editor-divider::before, .editor-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
}
.editor-toolbar {
    display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 12px;
    padding: 6px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r-sm);
}
.tb-btn {
    min-width: 32px; height: 30px; padding: 0 8px; border: none; border-radius: 6px;
    background: none; color: var(--text-2); font-size: 13px;
}
.tb-btn:hover { background: rgba(255, 255, 255, .07); color: #fff; }
.tb-sep { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }
.editor-content {
    width: 100%; min-height: 320px; resize: vertical; background: none; border: none; outline: none;
    color: var(--text); font: inherit; font-size: 16px; line-height: 1.7;
}
.editor-content::placeholder { color: var(--muted); }
.editor-stats { display: flex; flex-direction: column; gap: 14px; }
.estat-block { padding: 14px; background: var(--surf); border: 1px solid var(--border); border-radius: var(--r); }
.estat-block h4 {
    margin: 0 0 10px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted);
}
.seo-ring { position: relative; width: 80px; height: 80px; margin: 0 auto 10px; }
.seo-ring svg { width: 100%; height: 100%; }
.seo-num {
    position: absolute; inset: 0; top: -8px; display: grid; place-items: center;
    font-family: var(--f-mono); font-size: 22px; font-weight: 700;
}
.seo-lbl { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 10px; }
.seo-tip { font-size: 11.5px; line-height: 1.4; text-align: center; }
.estat-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
.estat-row span:last-child { font-family: var(--f-mono); }
.readab-bar-wrap { height: 6px; background: var(--surf-2); border-radius: 3px; overflow: hidden; }
.readab-bar { height: 100%; background: var(--p); border-radius: 3px; transition: width .4s; }
.readab-label { margin-top: 6px; font-size: 11.5px; }
.tag-input {
    width: 100%; padding: 8px 10px; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font: inherit; font-size: 13px; outline: none;
}
.tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag-chip {
    padding: 4px 9px; border: 1px solid var(--p); border-radius: 99px; background: none;
    color: var(--p); font-family: var(--f-mono); font-size: 11px;
}

/* ── transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform .32s cubic-bezier(.22, 1, .36, 1); }
.slide-enter-from, .slide-leave-to { transform: translateY(100%); }
</style>
