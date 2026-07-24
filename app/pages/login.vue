<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'
import type { Provider } from '~/components/ProviderTiles.vue'

const { t } = useI18n()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const nickname = ref('')
const agree = ref(false)
const chosen = ref<Provider | null>(null)

// порядок = популярность у нашей аудитории
const providers: Provider[] = [
    { id: 'yandex', name: 'Яндекс ID', mark: 'Я', color: '#FC3F1D' },
    { id: 'vk', name: 'VK ID', mark: 'VK', color: '#0077FF' },
    { id: 'telegram', name: 'Telegram', mark: 'TG', color: '#2AABEE' },
    { id: 'google', name: 'Google', mark: 'G', color: '#EA4335' },
    { id: 'github', name: 'GitHub', mark: 'GH', color: '#f0f6fc', ink: '#0d1117' },
    { id: 'discord', name: 'Discord', mark: 'DC', color: '#5865F2' },
    { id: 'steam', name: 'Steam', mark: 'ST', color: '#66c0f4', ink: '#0b1b28' },
    { id: 'apple', name: 'Apple', mark: 'A', color: '#ffffff', ink: '#000000' },
    { id: 'itch', name: 'itch.io', mark: 'IT', color: '#FA5C5C' },
    { id: 'mailru', name: 'Mail.ru', mark: 'MR', color: '#005FF9' },
    { id: 'ok', name: 'Одноклассники', mark: 'OK', color: '#EE8208' },
]

const { login, register, pending } = useAuth()
const { ok: toastOk, err: toastErr } = useToast()
const localePath = useLocalePath()

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

function pickProvider(p: Provider) {
    chosen.value = p
    // TODO: редирект на /api/auth/oauth/{p.id}
}

const canSubmit = computed(() =>
    mode.value === 'login'
        ? email.value.length > 3 && password.value.length >= 6
        : email.value.length > 3 && password.value.length >= 6 && nickname.value.length >= 3 && agree.value,
)

useSeoMeta({
    title: 'Вход — Dustore',
    description: 'Войдите в Dustore через DustID: Яндекс, VK, Telegram, Google, GitHub и другие сервисы.',
})
</script>

<template>
    <div class="wrap auth">
        <div class="auth__box pxc">
            <header class="auth__head">
                <p class="eyebrow"><span class="dot" />DustID</p>
                <h1>{{ mode === 'login' ? $t('auth.loginTitle') : $t('auth.signupTitle') }}</h1>
                <p class="muted auth__sub">{{ $t('auth.subtitle') }}</p>
            </header>

            <div class="tabs" role="tablist">
                <button class="tab" :class="{ 'is-on': mode === 'login' }" role="tab" :aria-selected="mode === 'login'"
                    @click="mode = 'login'">
                    {{ $t('auth.login') }}
                </button>
                <button class="tab" :class="{ 'is-on': mode === 'signup' }" role="tab"
                    :aria-selected="mode === 'signup'" @click="mode = 'signup'">
                    {{ $t('auth.signup') }}
                </button>
            </div>

            <!-- ===== 1. почта и пароль ===== -->
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

            <!-- ===== 2. сервисы плиткой ===== -->
            <ProviderTiles :model-value="chosen" :providers="providers" @update:model-value="pickProvider" />

            <button class="btn btn--primary auth__go"
                :style="chosen ? { background: chosen.color, borderColor: chosen.color, color: chosen.ink || '#fff' } : undefined"
                :disabled="!chosen">
                {{ chosen ? $t('auth.continueWith', { name: chosen.name }) : $t('auth.pickFirst') }}
            </button>

            <p class="auth__legal muted">{{ $t('auth.legal') }}</p>
        </div>
    </div>
</template>

<style scoped>
.auth {
    display: flex;
    justify-content: center;
    padding-block: clamp(20px, 6vw, 48px);
}

.auth__box {
    width: 100%;
    max-width: 470px;
    padding: clamp(20px, 5vw, 32px);
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
}

.auth__head h1 {
    margin-top: 10px;
    font-size: clamp(22px, 5.5vw, 28px);
}

.auth__sub {
    margin: 8px 0 0;
    font-size: 14px;
}

.tabs {
    display: flex;
    gap: 4px;
    margin: 22px 0 20px;
    padding: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.tab {
    flex: 1;
    min-height: 38px;
    background: none;
    border: none;
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 14px;
}

.tab.is-on {
    background: var(--p);
    color: #fff;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field span {
    font-size: 12px;
    color: var(--text-2);
}

.field input {
    min-height: var(--tap);
    padding: 0 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--text);
    font: inherit;
}

.field input:focus {
    outline: none;
    border-color: var(--p);
    box-shadow: 0 0 0 3px rgba(195, 33, 120, .22);
}

.check {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13px;
    color: var(--text-2);
}

.check input {
    width: 18px;
    height: 18px;
    accent-color: var(--p);
}

.forgot {
    align-self: flex-end;
    font-size: 12.5px;
    color: var(--text-2);
}

.forgot:hover {
    color: var(--p);
}

.btn:disabled {
    opacity: .45;
    cursor: not-allowed;
}

.or {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 18px;
    color: var(--muted);
    font-family: var(--f-mono);
    font-size: 11px;
}

.or::before,
.or::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
}

.auth__go {
    width: 100%;
    margin-top: 16px;
    transition: background .25s, border-color .25s, color .25s;
}

.demo {
    margin: -2px 0 0;
    padding: 9px 12px;
    background: var(--bg);
    border: 1px dashed var(--border);
    border-radius: var(--r-sm);
    font-family: var(--f-mono);
    font-size: 11px;
    text-align: center;
}

.auth__legal {
    margin: 18px 0 0;
    font-size: 11.5px;
    text-align: center;
    line-height: 1.5;
}
</style>