<script setup lang="ts">
import { useI18n } from '#imports'

/**
 * Чаты (бывший «Эфир») — порт мессенджера StayInspired под тёмную тему.
 * Демо: список диалогов + автоответчик. Позже подключается к реальному API.
 */

const { t } = useI18n()
const { user } = useAuth()
const { toast } = useToast()

useSeoMeta({ title: () => `${t('nav.ether')} — Dustore` })

interface Msg { mine: boolean; text: string; time: string; ini: string }
interface Chat {
    id: string; name: string; ini: string; handle: string; online: boolean
    preview: string; time: string; unread: number; msgs: Msg[]
}

const meIni = computed(() => user.value ? user.value.nick.slice(0, 2).toUpperCase() : 'Я')

const chats = reactive<Chat[]>([
    {
        id: 'c1', name: 'Мира Оконкво', ini: 'МО', handle: '@miradraws', online: true,
        preview: 'Спасибо за отзыв!…', time: '14:22', unread: 2,
        msgs: [
            { mine: false, ini: 'МО', text: 'Привет! Видела твой комментарий — очень точно подмечено.', time: '14:18' },
            { mine: false, ini: 'МО', text: 'Как насчёт совместного треда — рубрика «сделали вместе»?', time: '14:19' },
            { mine: true, ini: 'Я', text: 'Привет! Звучит интересно. Что именно ты представляешь?', time: '14:21' },
        ],
    },
    {
        id: 'c2', name: 'Даниэль Вей', ini: 'ДВ', handle: '@dvey', online: false,
        preview: 'Точно! Увидимся на…', time: 'вчера', unread: 0,
        msgs: [{ mine: false, ini: 'ДВ', text: 'Точно! Увидимся на джеме.', time: '20:04' }],
    },
    {
        id: 'c3', name: 'Sol', ini: 'So', handle: '@solmaking', online: true,
        preview: 'Ты пробовал Fraunces?', time: 'пн', unread: 1,
        msgs: [{ mine: false, ini: 'So', text: 'Ты пробовал Fraunces? Отличный шрифт для заголовков.', time: '11:30' }],
    },
    {
        id: 'c4', name: 'Тимур', ini: 'Ти', handle: '@tmr', online: false,
        preview: '👋', time: 'сб', unread: 0,
        msgs: [{ mine: false, ini: 'Ти', text: '👋', time: '09:12' }],
    },
    {
        id: 'c5', name: 'Ная', ini: 'На', handle: '@naya.writes', online: true,
        preview: 'Какой следующий пост?', time: 'пт', unread: 0,
        msgs: [{ mine: false, ini: 'На', text: 'Какой следующий пост планируешь?', time: '16:45' }],
    },
])

const AUTO = [
    'Интересная мысль, надо обдумать!',
    'Полностью согласна — давай попробуем.',
    'Именно об этом я и думала ✦',
    'Хорошая идея. Когда начнём?',
    'Да, звучит вдохновляюще!',
    'Отлично сказано 👌',
]

const activeId = ref('c1')
const active = computed(() => chats.find(c => c.id === activeId.value) || chats[0]!)
const draft = ref('')
const typing = ref(false)
const mobileOpen = ref(false) // на мобиле диалог открыт поверх списка
const areaEl = ref<HTMLElement | null>(null)

function selectChat(c: Chat) {
    activeId.value = c.id
    c.unread = 0
    mobileOpen.value = true
    scrollDown()
}
function backToList() { mobileOpen.value = false }

function now() {
    const d = new Date()
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function scrollDown() {
    await nextTick()
    if (areaEl.value) areaEl.value.scrollTop = areaEl.value.scrollHeight
}

function send() {
    const text = draft.value.trim()
    if (!text) return
    active.value.msgs.push({ mine: true, ini: meIni.value, text, time: now() })
    active.value.preview = text.slice(0, 40)
    active.value.time = now()
    draft.value = ''
    scrollDown()

    // индикатор набора + автоответ
    setTimeout(() => {
        typing.value = true
        scrollDown()
        setTimeout(() => {
            typing.value = false
            active.value.msgs.push({
                mine: false, ini: active.value.ini,
                text: AUTO[Math.floor(Math.random() * AUTO.length)]!, time: now(),
            })
            scrollDown()
        }, 1600)
    }, 600)
}

function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

onMounted(scrollDown)
</script>

<template>
    <div class="chats" :class="{ 'is-dialog': mobileOpen }">
        <!-- ── СПИСОК ── -->
        <section class="chat-list">
            <header class="cl-head">
                <h2>{{ t('nav.ether') }}</h2>
                <div class="search-mini">
                    <span class="s-ic">⌕</span>
                    <input type="text" placeholder="Поиск чатов…" />
                </div>
            </header>
            <div class="chat-items">
                <button v-for="c in chats" :key="c.id" class="chat-item" :class="{ active: c.id === activeId }"
                    @click="selectChat(c)">
                    <span class="ci-av">
                        {{ c.ini }}<span v-if="c.online" class="online-dot" />
                    </span>
                    <span class="ci-info">
                        <span class="ci-name">{{ c.name }}</span>
                        <span class="ci-prev muted">{{ c.preview }}</span>
                    </span>
                    <span class="ci-meta">
                        <span class="ci-time muted">{{ c.time }}</span>
                        <span v-if="c.unread" class="ci-badge">{{ c.unread }}</span>
                    </span>
                </button>
            </div>
        </section>

        <!-- ── ДИАЛОГ ── -->
        <section class="dialog">
            <header class="dlg-head">
                <button class="dlg-back" aria-label="К списку" @click="backToList">←</button>
                <span class="dlg-av">
                    {{ active.ini }}<span v-if="active.online" class="online-dot" />
                </span>
                <div class="dlg-who">
                    <div class="dlg-name">{{ active.name }}</div>
                    <div class="dlg-status muted">{{ active.online ? 'онлайн · ' : '' }}{{ active.handle }}</div>
                </div>
                <div class="dlg-acts">
                    <button class="dlg-act" @click="toast('Поиск по диалогу')">⌕</button>
                    <button class="dlg-act" @click="toast('Профиль пользователя')">☰</button>
                </div>
            </header>

            <div ref="areaEl" class="msgs-area">
                <div class="msg-day"><span>Сегодня</span></div>
                <div v-for="(m, i) in active.msgs" :key="i" class="msg-row" :class="{ mine: m.mine }">
                    <span class="msg-av">{{ m.ini }}</span>
                    <div class="bubble">{{ m.text }}<span class="btime">{{ m.time }}</span></div>
                </div>
                <div v-if="typing" class="msg-row">
                    <span class="msg-av">{{ active.ini }}</span>
                    <div class="typing-bub"><span /><span /><span /></div>
                </div>
            </div>

            <div class="msg-input-bar">
                <div class="msg-input-wrap">
                    <button class="msg-attach" @click="toast('Прикрепить файл')">＋</button>
                    <textarea v-model="draft" rows="1" placeholder="Написать…" @keydown="onKey" />
                </div>
                <button class="msg-send" aria-label="Отправить" @click="send">→</button>
            </div>
        </section>
    </div>
</template>

<style scoped>
.chats {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: calc(100dvh - 120px);
    margin: 14px clamp(12px, 3vw, 28px);
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
}
@media (min-width: 900px) {
    .chats { grid-template-columns: 320px minmax(0, 1fr); height: calc(100dvh - 96px); }
}

/* ── СПИСОК ── */
.chat-list { display: flex; flex-direction: column; border-right: 1px solid var(--border); min-height: 0; }
.cl-head { padding: 16px; border-bottom: 1px solid var(--border); }
.cl-head h2 { font-family: var(--f-display); font-size: 20px; margin-bottom: 12px; }
.search-mini {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
}
.search-mini .s-ic { color: var(--muted); }
.search-mini input { flex: 1; background: none; border: none; outline: none; color: var(--text); font: inherit; font-size: 13.5px; }
.search-mini input::placeholder { color: var(--muted); }
.chat-items { flex: 1; overflow-y: auto; padding: 6px; }
.chat-item {
    display: flex; align-items: center; gap: 11px; width: 100%; text-align: left;
    padding: 10px; border: none; background: none; border-radius: 12px; color: var(--text);
}
.chat-item:hover { background: rgba(255, 255, 255, .04); }
.chat-item.active { background: color-mix(in srgb, var(--p) 16%, transparent); }
.ci-av, .dlg-av, .msg-av {
    position: relative; display: grid; place-items: center; flex: none;
    border-radius: 50%; background: var(--surf-2); color: var(--text-2);
    font-family: var(--f-mono); font-weight: 600;
}
.ci-av { width: 44px; height: 44px; font-size: 13px; }
.online-dot {
    position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px;
    border-radius: 50%; background: #2ecc71; border: 2px solid var(--surf);
}
.ci-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ci-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-prev { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex: none; }
.ci-time { font-size: 11px; }
.ci-badge {
    display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px;
    border-radius: 99px; background: var(--p); color: #fff; font-family: var(--f-mono);
    font-size: 10px; font-weight: 700;
}

/* ── ДИАЛОГ ── */
.dialog { display: flex; flex-direction: column; min-height: 0; }
.dlg-head { display: flex; align-items: center; gap: 11px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.dlg-back { display: none; width: 34px; height: 34px; flex: none; border: none; background: none; color: var(--text); font-size: 18px; border-radius: 8px; }
.dlg-av { width: 40px; height: 40px; font-size: 12px; }
.dlg-who { flex: 1; min-width: 0; }
.dlg-name { font-family: var(--f-display); font-size: 15px; font-weight: 700; }
.dlg-status { font-size: 12px; }
.dlg-acts { display: flex; gap: 4px; }
.dlg-act { width: 34px; height: 34px; border: none; background: none; color: var(--text-2); border-radius: 8px; font-size: 15px; }
.dlg-act:hover { background: rgba(255, 255, 255, .06); color: #fff; }

.msgs-area { flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column; gap: 10px; }
.msg-day { text-align: center; margin: 4px 0 10px; }
.msg-day span {
    font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
    color: var(--muted); padding: 4px 12px; background: var(--bg); border-radius: 99px;
}
.msg-row { display: flex; align-items: flex-end; gap: 8px; max-width: 78%; }
.msg-row.mine { margin-left: auto; flex-direction: row-reverse; }
.msg-av { width: 28px; height: 28px; font-size: 9px; }
.bubble {
    position: relative; padding: 10px 14px 18px; border-radius: 16px;
    background: var(--surf-2); font-size: 14px; line-height: 1.5;
}
.msg-row.mine .bubble { background: var(--p); color: #fff; }
.btime { position: absolute; bottom: 4px; right: 12px; font-family: var(--f-mono); font-size: 9.5px; color: var(--muted); }
.msg-row.mine .btime { color: rgba(255, 255, 255, .7); }
.typing-bub { display: flex; gap: 4px; padding: 14px 16px; border-radius: 16px; background: var(--surf-2); }
.typing-bub span {
    width: 6px; height: 6px; border-radius: 50%; background: var(--muted);
    animation: blink 1.2s infinite;
}
.typing-bub span:nth-child(2) { animation-delay: .2s; }
.typing-bub span:nth-child(3) { animation-delay: .4s; }
@keyframes blink { 0%, 60%, 100% { opacity: .3; } 30% { opacity: 1; } }

.msg-input-bar { display: flex; align-items: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
.msg-input-wrap {
    flex: 1; display: flex; align-items: flex-end; gap: 6px; padding: 6px 6px 6px 10px;
    background: var(--bg); border: 1px solid var(--border); border-radius: 14px;
}
.msg-attach { width: 32px; height: 32px; flex: none; border: none; background: none; color: var(--text-2); font-size: 18px; border-radius: 8px; }
.msg-input-wrap textarea {
    flex: 1; max-height: 120px; resize: none; background: none; border: none; outline: none;
    color: var(--text); font: inherit; font-size: 14px; line-height: 1.5; padding: 6px 0;
}
.msg-input-wrap textarea::placeholder { color: var(--muted); }
.msg-send {
    width: 42px; height: 42px; flex: none; border: none; border-radius: 12px;
    background: var(--p); color: #fff; font-size: 18px;
}
.msg-send:hover { background: var(--p-hov); }

/* ── мобильный полноэкранный диалог ── */
@media (max-width: 899px) {
    .dialog {
        position: fixed; inset: 0; z-index: 60; background: var(--bg);
        transform: translateX(100%); transition: transform .3s cubic-bezier(.22, 1, .36, 1);
    }
    .chats.is-dialog .dialog { transform: none; }
    .dlg-back { display: grid; place-items: center; }
}
</style>
