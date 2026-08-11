<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { login, register, telegramComplete, pending } = useAuth()
const { ok: toastOk, err: toastErr } = useToast()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const nickname = ref('')
const agree = ref(false)

/* видимые провайдеры (остальные пока скрыты) */
const providers = [
    { id: 'yandex', name: 'Яндекс ID', mark: 'Я', color: '#FC3F1D', ink: '#fff' },
    { id: 'vk', name: 'VK ID', mark: 'VK', color: '#0077FF', ink: '#fff' },
] as const

/* Telegram — через официальный виджет (только чистый username) */
const pubBot = cleanBotName((useRuntimeConfig().public as any).telegramBot)
const tgBox = ref<HTMLElement | null>(null)

function goProvider(id: string) {
    window.location.href = `/api/auth/oauth/${id}`
}

/* ── шаг email для нового Telegram-пользователя (?tg=token) ── */
const pendingTg = ref(typeof route.query.tg === 'string' ? route.query.tg : '')
const tgEmail = ref('')
async function submitTg() {
    if (!tgEmail.value) return
    const r = await telegramComplete(pendingTg.value, tgEmail.value)
    if (r.ok) {
        toastOk('Аккаунт создан ✦')
        await navigateTo(localePath('/'))
    } else {
        toastErr(r.code === 'BAD_TOKEN'
            ? 'Ссылка устарела — войдите через Telegram заново'
            : 'Введите корректный email')
    }
}

/* ── обычная почта+пароль ── */
const ERRORS: Record<string, string> = {
    NO_SUCH_USER: 'auth.errNoUser', BAD_PASSWORD: 'auth.errPassword',
    EMAIL_TAKEN: 'auth.errEmailTaken', NICK_TAKEN: 'auth.errNickTaken',
    WEAK_PASSWORD: 'auth.errWeak', BAD_EMAIL: 'auth.errEmail', BAD_NICK: 'auth.errNick',
}
async function submit() {
    if (!canSubmit.value || pending.value) return
    const r = mode.value === 'login'
        ? await login(email.value, password.value)
        : await register(nickname.value, email.value, password.value)
    if (r.ok) {
        toastOk(t('auth.welcome'))
        await navigateTo(localePath('/'))
    } else {
        toastErr(t(ERRORS[r.code] || 'auth.errGeneric'))
    }
}
const canSubmit = computed(() =>
    mode.value === 'login'
        ? email.value.length > 3 && password.value.length >= 6
        : email.value.length > 3 && password.value.length >= 6 && nickname.value.length >= 3 && agree.value,
)

/* ── ошибки OAuth из query ── */
const OAUTH_ERR: Record<string, string> = {
    state: 'Сессия входа истекла — попробуйте снова',
    oauth: 'Не удалось получить данные от сервиса',
    conflict: 'Этот способ входа уже привязан к другому аккаунту',
    noemail: 'Сервис не передал email',
    tg: 'Не удалось проверить вход через Telegram',
}

onMounted(() => {
    const e = route.query.error
    if (typeof e === 'string' && OAUTH_ERR[e]) toastErr(OAUTH_ERR[e])

    // виджет Telegram (только если задано имя бота)
    if (pubBot && tgBox.value && !pendingTg.value) {
        const s = document.createElement('script')
        s.src = 'https://telegram.org/js/telegram-widget.js?22'
        s.async = true
        s.setAttribute('data-telegram-login', pubBot)
        s.setAttribute('data-size', 'large')
        s.setAttribute('data-radius', '10')
        s.setAttribute('data-auth-url', location.origin + '/api/auth/telegram/callback')
        s.setAttribute('data-request-access', 'write')
        tgBox.value.appendChild(s)
    }
})

useSeoMeta({
    title: 'Вход — Dustore',
    description: 'Войдите в Dustore через Яндекс ID, VK ID или Telegram. Один аккаунт для всех способов входа.',
})
</script>

<template>
    <div class="wrap auth">
        <div class="auth__box pxc">
            <header class="auth__head">
                <p class="eyebrow"><span class="dot" />DustID</p>
                <h1 v-if="!pendingTg">{{ mode === 'login' ? $t('auth.loginTitle') : $t('auth.signupTitle') }}</h1>
                <h1 v-else>Последний шаг</h1>
                <p class="muted auth__sub">
                    {{ pendingTg ? 'Укажите почту — она станет основой аккаунта и свяжет все способы входа.' : $t('auth.subtitle') }}
                </p>
            </header>

            <!-- ===== ШАГ EMAIL ПОСЛЕ TELEGRAM ===== -->
            <form v-if="pendingTg" class="form" @submit.prevent="submitTg">
                <label class="field">
                    <span>{{ $t('auth.email') }}</span>
                    <input v-model="tgEmail" type="email" autocomplete="email" placeholder="you@mail.ru">
                </label>
                <button class="btn btn--primary" type="submit" :disabled="tgEmail.length < 4 || pending">
                    {{ pending ? $t('auth.wait') : 'Создать аккаунт' }}
                </button>
                <p class="demo muted">Мы уже подтвердили ваш Telegram — осталось привязать почту.</p>
            </form>

            <!-- ===== ОБЫЧНЫЙ ВХОД ===== -->
            <template v-else>
                <div class="tabs" role="tablist">
                    <button class="tab" :class="{ 'is-on': mode === 'login' }" role="tab" @click="mode = 'login'">
                        {{ $t('auth.login') }}
                    </button>
                    <button class="tab" :class="{ 'is-on': mode === 'signup' }" role="tab" @click="mode = 'signup'">
                        {{ $t('auth.signup') }}
                    </button>
                </div>

                <form class="form" @submit.prevent="submit">
                    <label v-if="mode === 'signup'" class="field">
                        <span>{{ $t('auth.nickname') }}</span>
                        <input v-model="nickname" type="text" autocomplete="username" placeholder="nick">
                    </label>
                    <label class="field">
                        <span>{{ $t('auth.email') }}</span>
                        <input v-model="email" type="email" autocomplete="email" placeholder="you@mail.ru">
                    </label>
                    <label class="field">
                        <span>{{ $t('auth.password') }}</span>
                        <input v-model="password" type="password"
                            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" placeholder="••••••••">
                    </label>
                    <label v-if="mode === 'signup'" class="check">
                        <input v-model="agree" type="checkbox">
                        <span>{{ $t('auth.agree') }}</span>
                    </label>
                    <NuxtLink v-if="mode === 'login'" to="#" class="forgot">{{ $t('auth.forgot') }}</NuxtLink>
                    <button class="btn btn--primary" type="submit" :disabled="!canSubmit || pending">
                        {{ pending ? $t('auth.wait') : (mode === 'login' ? $t('auth.login') : $t('auth.createId')) }}
                    </button>
                    <p v-if="mode === 'login'" class="demo muted">{{ $t('auth.demo') }}</p>
                </form>

                <div class="or"><span>{{ $t('auth.or') }}</span></div>

                <!-- ===== ПРОВАЙДЕРЫ ===== -->
                <div class="prov">
                    <button v-for="p in providers" :key="p.id" class="provbtn" type="button"
                        :style="{ '--pc': p.color }" @click="goProvider(p.id)">
                        <span class="provbtn__mark" :style="{ background: p.color, color: p.ink }">{{ p.mark }}</span>
                        <span class="provbtn__name">Продолжить с {{ p.name }}</span>
                        <span class="provbtn__arw">→</span>
                    </button>

                    <!-- Telegram: официальный виджет либо подсказка -->
                    <div v-if="pubBot" ref="tgBox" class="tgbox" />
                    <div v-else class="provbtn is-off">
                        <span class="provbtn__mark" style="background:#2AABEE;color:#fff">TG</span>
                        <span class="provbtn__name">Telegram — задайте NUXT_PUBLIC_TELEGRAM_BOT</span>
                    </div>
                </div>

                <p class="auth__legal muted">{{ $t('auth.legal') }}</p>
            </template>
        </div>
    </div>
</template>

<style scoped>
.auth { display: flex; justify-content: center; padding-block: clamp(20px, 6vw, 48px); }
.auth__box {
    width: 100%; max-width: 470px; padding: clamp(20px, 5vw, 32px);
    background: var(--surf); border: 1px solid var(--border); border-radius: var(--r-lg);
}
.auth__head h1 { margin-top: 10px; font-size: clamp(22px, 5.5vw, 28px); }
.auth__sub { margin: 8px 0 0; font-size: 14px; }

.tabs { display: flex; gap: 4px; margin: 22px 0 20px; padding: 4px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--r); }
.tab { flex: 1; min-height: 38px; background: none; border: none; border-radius: var(--r-sm); color: var(--text-2); font-family: var(--f-display); font-weight: 700; font-size: 14px; }
.tab.is-on { background: var(--p); color: #fff; }

.form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field span { font-size: 12px; color: var(--text-2); }
.field input {
    min-height: var(--tap); padding: 0 14px; background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--r); color: var(--text); font: inherit;
}
.field input:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(195, 33, 120, .22); }
.check { display: flex; align-items: center; gap: 9px; font-size: 13px; color: var(--text-2); }
.check input { width: 18px; height: 18px; accent-color: var(--p); }
.forgot { align-self: flex-end; font-size: 12.5px; color: var(--text-2); }
.forgot:hover { color: var(--p); }
.btn:disabled { opacity: .45; cursor: not-allowed; }

.or { display: flex; align-items: center; gap: 12px; margin: 24px 0 18px; color: var(--muted); font-family: var(--f-mono); font-size: 11px; }
.or::before, .or::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* провайдеры */
.prov { display: flex; flex-direction: column; gap: 10px; }
.provbtn {
    display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 0 14px;
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--r);
    color: var(--text); text-align: left; transition: border-color .15s, background .15s;
}
.provbtn:hover { border-color: var(--pc, var(--p)); background: color-mix(in srgb, var(--pc, var(--p)) 8%, var(--bg)); }
.provbtn.is-off { opacity: .6; cursor: default; font-size: 12px; }
.provbtn__mark {
    display: grid; place-items: center; width: 34px; height: 34px; flex: none; border-radius: 9px;
    font-family: var(--f-mono); font-weight: 700; font-size: 13px;
}
.provbtn__name { flex: 1; min-width: 0; font-family: var(--f-display); font-weight: 600; font-size: 14.5px; }
.provbtn__arw { color: var(--muted); }
.tgbox { display: flex; justify-content: center; min-height: 48px; }

.demo {
    margin: -2px 0 0; padding: 9px 12px; background: var(--bg); border: 1px dashed var(--border);
    border-radius: var(--r-sm); font-family: var(--f-mono); font-size: 11px; text-align: center;
}
.auth__legal { margin: 18px 0 0; font-size: 11.5px; text-align: center; line-height: 1.5; }
</style>
