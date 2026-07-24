<script setup lang="ts">
/**
 * Главная фича v3.0 — публикация начинается с первого экрана.
 * Пока билд заливается, параллельно собираем профиль, студию и данные игры.
 */
const ACCEPT = ['.zip', '.rar', '.7z', '.apk', '.exe', '.love', '.html', '.wasm', '.pck']
const MAX_MB = 2048

const file = ref<File | null>(null)
const dragging = ref(false)
const progress = ref(0)
const error = ref('')
const done = ref(false)

// «залогинен» и «есть студия» — потом придут из сессии
const hasAccount = ref(false)
const hasStudio = ref(false)

const form = reactive({
    nick: '', email: '',
    studio: '',
    title: '', desc: '', tags: '', web: true,
})

let timer: ReturnType<typeof setInterval> | undefined

const sizeLabel = computed(() =>
    file.value ? `${(file.value.size / 1024 / 1024).toFixed(1)} МБ` : '',
)

/* ── шаги, которые заполняются параллельно загрузке ── */
const steps = computed(() => {
    const s = []
    if (!hasAccount.value) s.push('account')
    if (!hasStudio.value) s.push('studio')
    s.push('game')
    return s
})
const step = ref(0)
const currentStep = computed(() => steps.value[step.value])

const canSubmit = computed(() =>
    progress.value >= 100
    && form.title.trim().length >= 2
    && (hasAccount.value || (form.nick.length >= 3 && form.email.includes('@')))
    && (hasStudio.value || form.studio.trim().length >= 2),
)

function pick(f: File | null | undefined) {
    error.value = ''
    if (!f) return

    const ext = '.' + f.name.split('.').pop()!.toLowerCase()
    if (!ACCEPT.includes(ext)) {
        error.value = `Не тот формат. Нужен ${ACCEPT.slice(0, 4).join(', ')} и т.п.`
        return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
        error.value = `Слишком большой файл — максимум ${MAX_MB} МБ`
        return
    }

    file.value = f
    if (!form.title) form.title = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    startUpload()
}

function startUpload() {
    progress.value = 0
    clearInterval(timer)
    // TODO: заменить на реальную загрузку по частям на /api/uploads
    timer = setInterval(() => {
        progress.value = Math.min(100, progress.value + Math.random() * 7 + 2)
        if (progress.value >= 100) clearInterval(timer)
    }, 220)
}

function onDrop(e: DragEvent) {
    dragging.value = false
    pick(e.dataTransfer?.files?.[0])
}

function onInput(e: Event) {
    pick((e.target as HTMLInputElement).files?.[0])
}

function reset() {
    clearInterval(timer)
    file.value = null
    progress.value = 0
    done.value = false
    step.value = 0
    error.value = ''
}

function next() {
    if (step.value < steps.value.length - 1) step.value++
}

function submit() {
    done.value = true
}

onUnmounted(() => clearInterval(timer))
</script>

<template>
    <div class="up">
        <!-- ============ ЛЕВО: зона загрузки ============ -->
        <div class="up__left">
            <p class="eyebrow"><span class="dot" />{{ $t('upload.eyebrow') }}</p>
            <h1 class="up__title">{{ $t('upload.title') }}</h1>
            <p class="up__sub muted">{{ $t('upload.sub') }}</p>

            <!-- пусто: ждём файл -->
            <label v-if="!file" class="drop" :class="{ 'is-drag': dragging }" @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
                <input type="file" class="drop__input" :accept="ACCEPT.join(',')" @change="onInput">
                <span class="drop__ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                </span>
                <b>{{ $t('upload.drop') }}</b>
                <span class="drop__hint">{{ $t('upload.formats') }}</span>
            </label>

            <!-- файл выбран: прогресс -->
            <div v-else class="file">
                <div class="file__head">
                    <span class="file__ic">▦</span>
                    <div class="file__meta">
                        <b>{{ file.name }}</b>
                        <span class="muted">{{ sizeLabel }}</span>
                    </div>
                    <button class="file__x" :aria-label="$t('upload.cancel')" @click="reset">✕</button>
                </div>

                <div class="bar">
                    <div class="bar__fill" :style="{ width: progress + '%' }" />
                </div>
                <p class="file__status">
                    <template v-if="progress < 100">{{ $t('upload.uploading', { p: Math.round(progress) }) }}</template>
                    <template v-else><span class="ok">✔ {{ $t('upload.uploaded') }}</span></template>
                </p>
            </div>

            <p v-if="error" class="err">{{ error }}</p>

            <div v-if="!file" class="up__alt">
                <span class="muted">{{ $t('upload.orPlay') }}</span>
                <NuxtLink to="/games" class="btn btn--sm">{{ $t('hero.ctaAlt') }}</NuxtLink>
            </div>
        </div>

        <!-- ============ ПРАВО: параллельное оформление ============ -->
        <Transition name="slide">
            <aside v-if="file && !done" class="up__right">
                <div class="steps">
                    <span v-for="(s, i) in steps" :key="s" class="steps__i"
                        :class="{ 'is-on': i === step, 'is-done': i < step }">{{ i + 1 }}</span>
                    <span class="steps__label">{{ $t(`upload.step_${currentStep}`) }}</span>
                </div>

                <p class="up__while">{{ $t('upload.while') }}</p>

                <!-- шаг: аккаунт -->
                <div v-if="currentStep === 'account'" class="pane">
                    <label class="f"><span>{{ $t('auth.nickname') }}</span><input v-model="form.nick"
                            placeholder="nick"></label>
                    <label class="f"><span>{{ $t('auth.email') }}</span><input v-model="form.email" type="email"
                            placeholder="you@mail.ru"></label>
                    <p class="tip muted">{{ $t('upload.accountTip') }}</p>
                    <button class="btn btn--primary" :disabled="form.nick.length < 3 || !form.email.includes('@')"
                        @click="next">
                        {{ $t('upload.next') }}
                    </button>
                </div>

                <!-- шаг: студия -->
                <div v-else-if="currentStep === 'studio'" class="pane">
                    <label class="f"><span>{{ $t('upload.studioName') }}</span><input v-model="form.studio"
                            placeholder="tinyforge"></label>
                    <p class="tip muted">{{ $t('upload.studioTip') }}</p>
                    <button class="btn btn--primary" :disabled="form.studio.trim().length < 2" @click="next">
                        {{ $t('upload.next') }}
                    </button>
                </div>

                <!-- шаг: игра -->
                <div v-else class="pane">
                    <label class="f"><span>{{ $t('upload.gameTitle') }}</span><input v-model="form.title"></label>
                    <label class="f"><span>{{ $t('upload.gameDesc') }}</span><textarea v-model="form.desc" rows="3"
                            :placeholder="$t('upload.descPh')" /></label>
                    <label class="f"><span>{{ $t('upload.gameTags') }}</span><input v-model="form.tags"
                            placeholder="уют, godot, пиксель"></label>
                    <label class="chk"><input v-model="form.web" type="checkbox"><span>{{ $t('upload.webBuild')
                            }}</span></label>

                    <button class="btn btn--primary" :disabled="!canSubmit" @click="submit">
                        {{ progress < 100 ? $t('upload.waitUpload') : $t('upload.send') }} </button>
                </div>
            </aside>
        </Transition>

        <!-- ============ готово ============ -->
        <Transition name="slide">
            <aside v-if="done" class="up__right up__right--done">
                <span class="done__ic">✔</span>
                <h3>{{ $t('upload.doneTitle') }}</h3>
                <p class="muted">{{ $t('upload.doneText', { name: form.title }) }}</p>
                <button class="btn" @click="reset">{{ $t('upload.another') }}</button>
            </aside>
        </Transition>
    </div>
</template>

<style scoped>
.up {
    position: relative;
    display: grid;
    gap: clamp(20px, 4vw, 34px);
    padding: clamp(22px, 5vw, 44px);
    background: var(--hero);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
}

.up::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(255, 255, 255, .022) 3px 4px);
    pointer-events: none;
}

.up__left,
.up__right {
    position: relative;
}

.up__title {
    margin: 12px 0 0;
    font-family: var(--f-brand);
    font-size: clamp(26px, 6.2vw, 42px);
    line-height: 1.1;
}

.up__sub {
    margin: 12px 0 0;
    font-size: clamp(13.5px, 3.4vw, 15px);
    max-width: 440px;
}

/* ---- зона перетаскивания ---- */
.drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 22px;
    padding: clamp(26px, 6vw, 40px) 20px;
    border: 2px dashed var(--border);
    border-radius: var(--r);
    background: rgba(0, 0, 0, .25);
    cursor: pointer;
    text-align: center;
    transition: border-color .2s, background .2s, transform .2s;
}

.drop:hover,
.drop.is-drag {
    border-color: var(--p);
    background: color-mix(in srgb, var(--p) 12%, rgba(0, 0, 0, .25));
}

.drop.is-drag {
    transform: scale(1.015);
}

.drop__input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}

.drop__ic {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 13px;
    background: var(--p);
    color: #fff;
}

.drop__ic svg {
    width: 22px;
    height: 22px;
}

.drop b {
    font-family: var(--f-display);
    font-size: clamp(15px, 3.8vw, 18px);
}

.drop__hint {
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--muted);
}

/* ---- файл + прогресс ---- */
.file {
    margin-top: 22px;
    padding: 16px;
    background: rgba(0, 0, 0, .3);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.file__head {
    display: flex;
    align-items: center;
    gap: 11px;
}

.file__ic {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 9px;
    background: var(--surf-2);
    color: var(--violet);
}

.file__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.file__meta b {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file__meta span {
    font-family: var(--f-mono);
    font-size: 11px;
}

.file__x {
    width: 30px;
    height: 30px;
    flex: none;
    background: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--muted);
}

.bar {
    height: 6px;
    margin: 14px 0 8px;
    border-radius: 3px;
    background: rgba(255, 255, 255, .08);
    overflow: hidden;
}

.bar__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--p), var(--violet));
    transition: width .25s ease;
}

.file__status {
    margin: 0;
    font-family: var(--f-mono);
    font-size: 11.5px;
    color: var(--text-2);
}

.ok {
    color: #2ecc71;
}

.err {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-sm);
    background: rgba(214, 48, 49, .14);
    border: 1px solid rgba(214, 48, 49, .4);
    font-size: 13px;
    color: #ff9b9c;
}

.up__alt {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    font-size: 13px;
    flex-wrap: wrap;
}

/* ---- правая колонка ---- */
.up__right {
    padding: 18px;
    background: rgba(20, 4, 29, .72);
    border: 1px solid var(--border);
    border-radius: var(--r);
    backdrop-filter: blur(6px);
}

.steps {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 6px;
}

.steps__i {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--surf-2);
    color: var(--muted);
    font-family: var(--f-mono);
    font-size: 11px;
}

.steps__i.is-on {
    background: var(--p);
    color: #fff;
}

.steps__i.is-done {
    background: rgba(46, 204, 113, .2);
    color: #2ecc71;
}

.steps__label {
    margin-left: 4px;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 14px;
}

.up__while {
    margin: 0 0 14px;
    font-family: var(--f-mono);
    font-size: 10.5px;
    color: var(--muted);
}

.pane {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.f {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.f span {
    font-size: 11.5px;
    color: var(--text-2);
}

.f input,
.f textarea {
    min-height: 40px;
    padding: 9px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    color: var(--text);
    font: inherit;
    font-size: 14px;
    resize: vertical;
}

.f input:focus,
.f textarea:focus {
    outline: none;
    border-color: var(--p);
}

.chk {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-2);
}

.chk input {
    width: 17px;
    height: 17px;
    accent-color: var(--p);
}

.tip {
    margin: -4px 0 0;
    font-size: 11.5px;
    line-height: 1.45;
}

.btn:disabled {
    opacity: .45;
    cursor: not-allowed;
}

/* готово */
.up__right--done {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
}

.done__ic {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(46, 204, 113, .18);
    color: #2ecc71;
    font-size: 22px;
}

.up__right--done h3 {
    font-size: 18px;
}

.up__right--done p {
    margin: 0;
    font-size: 13px;
}

.slide-enter-active,
.slide-leave-active {
    transition: opacity .3s, transform .3s;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

@media (min-width: 900px) {
    .up {
        grid-template-columns: 1fr 340px;
        align-items: start;
    }

    .slide-enter-from,
    .slide-leave-to {
        transform: translateX(14px);
    }
}
</style>