<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Связанные способы входа: подключить/отвязать Яндекс, VK, Telegram. */

const localePath = useLocalePath()
const { user } = useAuth()
const { ok: toastOk, err: toastErr } = useToast()

interface Identity { provider: 'yandex' | 'vk' | 'telegram'; email: string | null; createdAt: string }

const pubBot = cleanBotName((useRuntimeConfig().public as any).telegramBot)

const { data, refresh } = await useFetch<{ identities: Identity[]; hasPassword: boolean }>(
    '/api/auth/identities')

const providers = [
    { id: 'yandex', name: 'Яндекс ID', mark: 'Я', color: '#FC3F1D', ink: '#fff' },
    { id: 'vk', name: 'VK ID', mark: 'VK', color: '#0077FF', ink: '#fff' },
    { id: 'telegram', name: 'Telegram', mark: 'TG', color: '#2AABEE', ink: '#fff' },
] as const

const linked = computed(() => new Map((data.value?.identities ?? []).map(i => [i.provider, i])))
const hasPassword = computed(() => data.value?.hasPassword ?? false)
const linkedCount = computed(() => data.value?.identities.length ?? 0)

function connect(id: string) {
    if (id === 'telegram') return // виджет сам инициирует
    window.location.href = `/api/auth/oauth/${id}?link=1`
}

async function disconnect(id: string) {
    try {
        await $fetch(`/api/auth/identities/${id}`, { method: 'DELETE' })
        toastOk('Способ входа отвязан')
        await refresh()
    } catch (e: any) {
        const code = e?.data?.statusMessage || e?.statusMessage
        toastErr(code === 'LAST_METHOD'
            ? 'Нельзя отвязать последний способ входа — сначала задайте пароль или подключите другой сервис'
            : 'Не удалось отвязать')
    }
}

function fmtDate(s: string) {
    try { return new Date(s).toLocaleDateString('ru-RU') } catch { return '' }
}

// виджет Telegram для привязки (callback свяжет с текущей сессией)
onMounted(() => {
    if (!pubBot || linked.value.has('telegram')) return
    const box = document.getElementById('tg-connect')
    if (!box || box.dataset.ready) return
    box.dataset.ready = '1'
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', pubBot)
    s.setAttribute('data-size', 'medium')
    s.setAttribute('data-radius', '8')
    s.setAttribute('data-auth-url', location.origin + '/api/auth/telegram/callback')
    s.setAttribute('data-request-access', 'write')
    box.appendChild(s)
})

useSeoMeta({ title: 'Связанные аккаунты — Dustore' })
</script>

<template>
    <div class="wrap settings">
        <NuxtLink :to="localePath('/profile')" class="back">← Профиль</NuxtLink>
        <h1>Связанные аккаунты</h1>
        <p class="muted lead">Все способы входа ведут в один аккаунт. Подключите сервисы, чтобы входить как удобно.</p>

        <div v-if="!user" class="card guest">
            <p class="muted">Войдите, чтобы управлять привязками.</p>
            <NuxtLink :to="localePath('/login')" class="btn btn--primary btn--sm">Войти</NuxtLink>
        </div>

        <div v-else class="list">
            <div v-for="p in providers" :key="p.id" class="row card">
                <span class="row__mark" :style="{ background: p.color, color: p.ink }">{{ p.mark }}</span>
                <div class="row__info">
                    <div class="row__name">{{ p.name }}</div>
                    <div v-if="linked.get(p.id)" class="row__meta">
                        <span class="ok">● подключено</span>
                        <span v-if="linked.get(p.id)?.email" class="muted"> · {{ linked.get(p.id)?.email }}</span>
                        <span class="muted"> · с {{ fmtDate(linked.get(p.id)?.createdAt || '') }}</span>
                    </div>
                    <div v-else class="row__meta muted">не подключено</div>
                </div>

                <template v-if="linked.get(p.id)">
                    <button class="btn btn--sm danger"
                        :disabled="!hasPassword && linkedCount <= 1"
                        :title="!hasPassword && linkedCount <= 1 ? 'Последний способ входа' : ''"
                        @click="disconnect(p.id)">Отвязать</button>
                </template>
                <template v-else>
                    <div v-if="p.id === 'telegram'">
                        <div v-if="pubBot" id="tg-connect" class="tgbox" />
                        <span v-else class="muted off">не настроен</span>
                    </div>
                    <button v-else class="btn btn--sm" @click="connect(p.id)">Подключить</button>
                </template>
            </div>

            <p class="hint muted">
                Совет: задайте пароль в профиле — тогда сможете входить даже без сторонних сервисов.
            </p>
        </div>
    </div>
</template>

<style scoped>
.settings { max-width: 620px; padding-block: clamp(20px, 5vw, 36px); }
.back { display: inline-block; margin-bottom: 16px; font-family: var(--f-mono); font-size: 13px; color: var(--text-2); }
.back:hover { color: var(--p); }
.settings h1 { font-size: clamp(22px, 5vw, 30px); }
.lead { margin: 8px 0 22px; font-size: 14px; }

.guest { padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
.row__mark {
    display: grid; place-items: center; width: 42px; height: 42px; flex: none; border-radius: 11px;
    font-family: var(--f-mono); font-weight: 700; font-size: 14px;
}
.row__info { flex: 1; min-width: 0; }
.row__name { font-family: var(--f-display); font-weight: 600; font-size: 15px; }
.row__meta { margin-top: 3px; font-size: 12.5px; }
.ok { color: var(--ok); font-family: var(--f-mono); font-size: 11.5px; }
.danger { color: #ff9b9c; border-color: rgba(255, 155, 156, .4); }
.danger:hover:not(:disabled) { border-color: #ff9b9c; }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.tgbox { min-height: 34px; }
.off { font-size: 12px; }
.hint { margin-top: 8px; font-size: 12.5px; line-height: 1.5; }
</style>
