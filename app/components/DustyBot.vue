<script setup lang="ts">
/**
 * Дасти — помощник-котик. Порт логики из старого header.php под Vue.
 * Открывается лапкой в хедере (useDusty). Кадры котика лежат в public/dusty/.
 * Отвечает по кнопкам (топики зависят от текущей страницы); на текстовый
 * ввод пока отвечает одной фразой.
 */

const { open, hide } = useDusty()
const route = useRoute()

const IMG = '/dusty' // папка с кадрами (public/dusty/)

/* ── кадры по эмоциям ── */
const F = (n: string) => `${IMG}/${n}.png`
const cat: Record<string, { talk: string[]; idle: string[] }> = {
    normal: { talk: [F('dastyframe1'), F('dastyframe2'), F('dastyframe3')], idle: [F('dastyframe_idle'), F('dastyframe_idle2')] },
    happy: { talk: [F('dastyframe_happy1'), F('dastyframe_happy2'), F('dastyframe_happy3')], idle: [F('dastyframe_happy_idle'), F('dastyframe_happy_idle2')] },
    think: { talk: [F('dastyframe_think1'), F('dastyframe_think2'), F('dastyframe_think3')], idle: [F('dastyframe_think_idle'), F('dastyframe_think_idle2'), F('dastyframe_think_idle3')] },
    sleepy: { talk: [F('dastyframe_sleepy1'), F('dastyframe_sleepy2'), F('dastyframe_sleepy3')], idle: [F('dastyframe_sleepy_idle'), F('dastyframe_sleepy_idle2')] },
}

const TALK_SPEED = 150, BLINK_SPEED = 100, BLINK_MIN = 1000, BLINK_MAX = 3000

/* ── база знаний по разделам ── */
interface Topic { label: string; answer: string; emotion?: string }
interface Page { greetings: string[]; topics: Topic[] }
const KB: Record<string, Page> = {
    home: {
        greetings: ['Ты на главной Dustore! Что хочешь узнать?', 'О, привет! Куда направимся?', 'Главная — сердце платформы. Выбирай!'],
        topics: [
            { label: 'Что такое Dustore?', answer: 'Dustore — открытая платформа для инди-разработчиков и игроков. Публикуй игры, ищи команду, участвуй в джемах.', emotion: 'happy' },
            { label: 'Куда пойти с главной?', answer: 'Загляни в «Игры» (каталог), «Ленту» вдохновения или «Мобильные». А профиль и вход — в правом верхнем углу.' },
            { label: 'Как стать разработчиком?', answer: 'Нажми «Devs» / консоль разработчика. Если аккаунта нет — предложим создать.' },
        ],
    },
    games: {
        greetings: ['Ты в каталоге игр! Чем помочь?', 'Ищешь что-то конкретное? Подскажу.', 'Ого, сколько игр! Найдём ту самую.'],
        topics: [
            { label: 'Как найти игру?', answer: 'Ищи по названию, фильтруй по тегам или листай страницы. Сверху есть поиск и фильтры.' },
            { label: 'Как скачать игру?', answer: 'Зайди на страницу игры и нажми «Скачать» или «Играть в браузере». Комиссия для тебя — 0%.' },
            { label: 'Что за возрастные метки?', answer: 'Рядом с игрой есть возрастной рейтинг (0+, 12+, 18+). Смотри перед установкой.', emotion: 'think' },
        ],
    },
    game: {
        greetings: ['Ты на странице игры! Рассказать подробнее?', 'Вот она — игра! Смотри трейлер и скриншоты.', 'Готов оценить проект?'],
        topics: [
            { label: 'Как скачать эту игру?', answer: 'Большая кнопка «Скачать» справа. Если игра платная — сначала оплата, для тебя без комиссии.', emotion: 'happy' },
            { label: 'Как оставить отзыв?', answer: 'Прокрути до блока «Отзывы» и поставь оценку. Разработчики читают фидбек.' },
            { label: 'Игра не запускается', answer: 'Проверь системные требования в описании. Если всё ок — нажми «Пожаловаться» или напиши в «Битый Пиксель».', emotion: 'think' },
        ],
    },
    feed: {
        greetings: ['Это Лента вдохновения! Полистаем?', 'Тут делятся мыслями и находками. Спрашивай.', 'Лента — про идеи и процесс.'],
        topics: [
            { label: 'Что здесь можно?', answer: 'Публиковать заметки и статьи, отвечать в тредах, листать посты как Reels и открывать профили авторов.', emotion: 'happy' },
            { label: 'Как опубликовать?', answer: 'Напиши в поле сверху и нажми «Опубликовать». Длинное — оформится статьёй в редакторе.' },
        ],
    },
    apps: {
        greetings: ['Раздел мобильных игр и приложений!', 'Тут инди для телефона. Что интересно?'],
        topics: [
            { label: 'Чем отличается от каталога?', answer: 'Здесь мобильные игры и приложения — карточки с иконками, страница в стиле магазина.' },
            { label: 'Как установить?', answer: 'На странице приложения — кнопка «Загрузить». Дальше по инструкции магазина.', emotion: 'happy' },
        ],
    },
    profile: {
        greetings: ['Это профиль игрока!', 'Тут активность, ссылки и статистика.'],
        topics: [
            { label: 'Как связать аккаунты?', answer: 'В своём профиле → «Настройки» → «Связанные аккаунты». Один вход — один аккаунт: Яндекс, VK, Telegram.', emotion: 'think' },
            { label: 'Как изменить профиль?', answer: 'На своей странице профиля есть вкладка «Редактировать»: имя, город, «о себе», ссылки.' },
        ],
    },
    chats: {
        greetings: ['Раздел Чаты! Тут общение.', 'Личные переписки и уведомления платформы.'],
        topics: [
            { label: 'Что за чат уведомлений?', answer: 'Отдельный чат, где платформа шлёт важные события: модерация, ответы, новости.', emotion: 'happy' },
        ],
    },
    login: {
        greetings: ['Вход в Dustore!', 'Заходи через Яндекс, VK или Telegram.'],
        topics: [
            { label: 'Какой способ выбрать?', answer: 'Любой — они ведут в один аккаунт. Почта спрашивается при регистрации и связывает все входы.', emotion: 'think' },
        ],
    },
    _default: {
        greetings: ['Я Дасти! Чем помочь?', 'Привет-привет! Что делаем?', 'Дасти на связи. Задавай вопрос!'],
        topics: [
            { label: 'Что такое Dustore?', answer: 'Платформа для инди-разработчиков и игроков: игры, джемы, команды, лента.' },
            { label: 'Как зарегистрироваться?', answer: 'Нажми «Войти» в правом верхнем углу. Регистрация бесплатна.' },
        ],
    },
}
const timeGreet: Record<string, string[]> = {
    morning: ['Доброе утро! Как настроение?', 'Утречка! Кофе уже выпил?'],
    day: ['Добрый день! Время открытий.', 'День в разгаре! Чем займёмся?'],
    evening: ['Добрый вечер! Как прошёл день?', 'Вечер — лучшее время для инди.'],
    night: ['Полуночничаешь? Я с тобой.', 'Тихая ночь — отличное время для вопросов.'],
}

function pageKey(): string {
    const p = route.path.replace(/^\/en/, '') || '/'
    if (p === '/') return 'home'
    const seg = p.split('/')[1] || ''
    if (seg === 'games') return p.split('/').filter(Boolean).length > 1 ? 'game' : 'games'
    if (['apps', 'feed', 'chats', 'login'].includes(seg)) return seg
    if (seg === 'u' || seg === 'profile') return 'profile'
    return '_default'
}
const kb = computed(() => KB[pageKey()] || KB._default)

/* ── анимация котика ── */
const frame = ref(cat.normal.idle[0])
let talkT: any = null, idleT: any = null, blinkT: any = null, typeT: any = null
let curEmotion = 'normal'

function stopAnim() { clearInterval(talkT); clearTimeout(idleT); clearInterval(blinkT); clearTimeout(typeT); talkT = idleT = blinkT = typeT = null }
function talkAnim(frames: string[]) {
    stopAnim(); if (!frames.length) return
    let i = 0; frame.value = frames[0]!
    talkT = setInterval(() => { i = (i + 1) % frames.length; frame.value = frames[i]! }, TALK_SPEED)
}
function idleAnim(frames: string[]) {
    stopAnim()
    if (frames.length < 2) { frame.value = frames[0] || cat.normal.idle[0]!; return }
    const cycle = () => {
        frame.value = frames[0]!
        const pause = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN)
        idleT = setTimeout(() => {
            let step = 1; frame.value = frames[step]!
            blinkT = setInterval(() => {
                step++
                if (step >= frames.length) { clearInterval(blinkT); blinkT = null; frame.value = frames[0]!; cycle() }
                else frame.value = frames[step]!
            }, BLINK_SPEED)
        }, pause)
    }
    cycle()
}
function catTalk(e = 'normal') { curEmotion = e; talkAnim(cat[e]?.talk || cat.normal.talk) }
function catIdle(e = 'normal') { curEmotion = e; idleAnim(cat[e]?.idle || cat.normal.idle) }

/* ── диалог ── */
const text = ref('')
const buttons = ref<{ label: string; run: () => void }[]>([])
const draft = ref('')

function type(msg: string, emotion = 'normal', done?: () => void) {
    clearTimeout(typeT); text.value = ''; let i = 0; catTalk(emotion)
    const step = () => {
        if (i < msg.length) { text.value += msg.charAt(i); i++; typeT = setTimeout(step, 22) }
        else { catIdle(emotion); done?.() }
    }
    step()
}

function randGreeting() {
    const g = kb.value.greetings
    return g[Math.floor(Math.random() * g.length)]!
}
function showTopics() {
    buttons.value = kb.value.topics.map(t => ({
        label: t.label,
        run: () => {
            const night = new Date().getHours() < 6
            type(t.answer, t.emotion || (night ? 'sleepy' : 'normal'), () => {
                buttons.value = [{ label: 'Ещё вопрос?', run: () => { text.value = randGreeting(); showTopics() } }]
            })
        },
    }))
}

function askText() {
    const q = draft.value.trim()
    if (!q) return
    draft.value = ''
    type('Пока я понимаю только кнопки ниже — учусь отвечать на вопросы, скоро смогу! 🐾', 'think', showTopics)
}

function openBot() {
    text.value = ''; buttons.value = []
    const h = new Date().getHours()
    let key = 'day', emo = 'normal'
    if (h >= 6 && h < 12) key = 'morning'
    else if (h >= 12 && h < 18) key = 'day'
    else if (h >= 18 && h < 24) key = 'evening'
    else { key = 'night'; emo = 'sleepy' }
    const greeting = Math.random() < 0.4
        ? timeGreet[key]![Math.floor(Math.random() * timeGreet[key]!.length)]!
        : randGreeting()
    type(greeting, emo, showTopics)
}
function closeBot() { stopAnim(); frame.value = cat.normal.idle[0]!; hide() }

watch(open, (v) => { if (v) openBot(); else stopAnim() })
onUnmounted(stopAnim)
</script>

<template>
    <Teleport to="body">
        <Transition name="dz">
            <div v-if="open" class="dz" @click.self="closeBot">
                <div class="dz__box">
                    <button class="dz__x" aria-label="Закрыть" @click="closeBot">✕</button>

                    <div class="dz__cat">
                        <img :src="frame" alt="Дасти" @error="$event.target.style.opacity = '0'">
                    </div>

                    <div class="dz__right">
                        <div class="dz__dialogue">
                            <p class="dz__text">{{ text }}</p>
                        </div>
                        <div class="dz__actions">
                            <button v-for="b in buttons" :key="b.label" class="dz__btn" @click="b.run">{{ b.label
                                }}</button>
                        </div>
                        <form class="dz__ask" @submit.prevent="askText">
                            <input v-model="draft" type="text" placeholder="Спросить Дасти…">
                            <button type="submit" aria-label="Отправить">→</button>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.dz {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: end center;
    padding: 0 0 24px;
    background: rgba(0, 0, 0, .5);
    backdrop-filter: blur(4px);
}
@media (min-width: 700px) { .dz { place-items: center; padding: 20px; } }

.dz__box {
    position: relative;
    width: 100%;
    max-width: 620px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 18px;
    background: var(--surf-2);
    border: 1px solid var(--border);
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -18px 50px rgba(0, 0, 0, .6);
}
@media (min-width: 700px) {
    .dz__box { grid-template-columns: 190px 1fr; gap: 16px; border-radius: 22px; }
}

.dz__x {
    position: absolute; top: 10px; right: 12px; z-index: 2;
    width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 9px;
    background: var(--bg); color: var(--muted);
}

.dz__cat {
    display: grid; place-items: center; min-height: 150px;
}
.dz__cat img {
    width: 100%; max-width: 180px; image-rendering: pixelated;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, .4));
}

.dz__right { display: flex; flex-direction: column; min-width: 0; }
.dz__dialogue {
    flex: 1; min-height: 68px; padding: 14px 16px;
    background: var(--bg); border: 1px solid var(--border); border-radius: 14px;
}
.dz__text { margin: 0; font-size: 15px; line-height: 1.55; min-height: 1.55em; }
.dz__text::after { content: '▍'; color: var(--p); animation: caret 1s steps(1) infinite; }

@keyframes caret { 50% { opacity: 0; } }

.dz__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.dz__btn {
    padding: 9px 14px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--surf); color: var(--text); font-size: 13.5px; text-align: left;
    transition: border-color .15s, background .15s;
}
.dz__btn:hover { border-color: var(--p); background: color-mix(in srgb, var(--p) 12%, var(--surf)); }

.dz__ask { display: flex; gap: 8px; margin-top: 12px; }
.dz__ask input {
    flex: 1; min-height: 42px; padding: 0 14px; background: var(--bg);
    border: 1px solid var(--border); border-radius: 12px; color: var(--text); font: inherit; font-size: 14px;
}
.dz__ask input:focus { outline: none; border-color: var(--p); }
.dz__ask button {
    width: 44px; flex: none; border: none; border-radius: 12px; background: var(--p); color: #fff; font-size: 18px;
}

.dz-enter-active, .dz-leave-active { transition: opacity .25s; }
.dz-enter-active .dz__box, .dz-leave-active .dz__box { transition: transform .3s cubic-bezier(.2, .8, .2, 1); }
.dz-enter-from, .dz-leave-to { opacity: 0; }
.dz-enter-from .dz__box, .dz-leave-to .dz__box { transform: translateY(40px); }
</style>
