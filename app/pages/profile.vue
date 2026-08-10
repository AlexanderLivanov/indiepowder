<script setup lang="ts">
import { useI18n, useLocalePath } from '#imports'

const { t } = useI18n()
const localePath = useLocalePath()
const { user, logout, saveProfile } = useAuth()
const { ok: toastOk, err: toastErr } = useToast()

// на страницу профиля пускаем только вошедших
watchEffect(() => {
    if (import.meta.client && !user.value) navigateTo(localePath('/login'))
})

const tab = ref<'about' | 'edit' | 'settings'>('about')
const saving = ref(false)

const form = reactive({
    displayName: '', city: '', country: '',
    about: '', website: '', vk: '', l4tRole: '',
})

watchEffect(() => {
    if (!user.value) return
    form.displayName = user.value.displayName || ''
    form.city = user.value.city || ''
    form.country = user.value.country || ''
    form.about = user.value.about || ''
    form.website = user.value.website || ''
    form.vk = user.value.vk || ''
    form.l4tRole = user.value.l4tRole || ''
})

async function save() {
    saving.value = true
    try {
        await saveProfile({ ...form })
        toastOk(t('profile.saved'))
        tab.value = 'about'
    } catch {
        toastErr(t('profile.saveError'))
    } finally { saving.value = false }
}

/* ── QR на профиль ── */
const qr = ref('')
const qrOpen = ref(false)
const profileUrl = computed(() =>
    import.meta.client && user.value ? `${location.origin}/u/${user.value.nick}` : '')

async function showQr() {
    qrOpen.value = true
    if (qr.value) return
    const QR = (await import('qrcode')).default
    qr.value = await QR.toDataURL(profileUrl.value, {
        width: 320, margin: 1,
        color: { dark: '#14041d', light: '#ffffff' },
    })
}

function copyLink() {
    navigator.clipboard?.writeText(profileUrl.value)
    toastOk(t('profile.linkCopied'))
}

const regDate = computed(() => {
    if (!user.value?.registered) return '—'
    return new Date(user.value.registered).toLocaleDateString('ru-RU',
        { day: '2-digit', month: 'long', year: 'numeric' })
})

const roleLabel = computed(() => {
    const r = user.value?.role
    return r === 'root' ? t('profile.roleRoot') : r === 'moder' ? t('profile.roleModer') : t('profile.roleUser')
})

useSeoMeta({ title: () => user.value ? `${user.value.nick} — Dustore` : 'Профиль' })
</script>

<template>
    <div v-if="user" class="pr">
        <!-- ═════ шапка профиля ═════ -->
        <header class="hero">
            <div class="hero__glow" aria-hidden="true" />

            <div class="hero__ava" :style="user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined">
                <span v-if="!user.avatarUrl">{{ user.nick.slice(0, 2).toUpperCase() }}</span>
            </div>

            <div class="hero__i">
                <h1>
                    {{ user.nick }}
                    <span v-if="user.verified" class="vfd" :title="$t('game.verified')">✓</span>
                </h1>
                <p v-if="user.displayName" class="hero__name">{{ user.displayName }}</p>
                <p class="hero__meta muted">
                    <span class="chip">{{ roleLabel }}</span>
                    <span v-if="user.l4tRole" class="chip">{{ user.l4tRole }}</span>
                    <span v-if="user.city">📍 {{ user.city }}<template v-if="user.country">, {{ user.country
                            }}</template></span>
                </p>
            </div>

            <div class="hero__act">
                <button class="btn btn--sm" @click="showQr">▦ QR</button>
                <button class="btn btn--sm" @click="copyLink">🔗 {{ $t('profile.copyLink') }}</button>
            </div>
        </header>

        <!-- ═════ цифры ═════ -->
        <dl class="stats">
            <div>
                <dt>{{ user.votesUp }}</dt>
                <dd>{{ $t('profile.votesUp') }}</dd>
            </div>
            <div>
                <dt>{{ user.profileViews }}</dt>
                <dd>{{ $t('profile.views') }}</dd>
            </div>
            <div>
                <dt>{{ regDate }}</dt>
                <dd>{{ $t('profile.since') }}</dd>
            </div>
            <div>
                <dt>#{{ user.id }}</dt>
                <dd>DustID</dd>
            </div>
        </dl>

        <!-- ═════ вкладки ═════ -->
        <nav class="tabs">
            <button :class="{ 'is-on': tab === 'about' }" @click="tab = 'about'">{{ $t('profile.tabAbout') }}</button>
            <button :class="{ 'is-on': tab === 'edit' }" @click="tab = 'edit'">{{ $t('profile.tabEdit') }}</button>
            <button :class="{ 'is-on': tab === 'settings' }" @click="tab = 'settings'">{{ $t('profile.tabSettings')
                }}</button>
        </nav>

        <!-- ═════ о себе ═════ -->
        <section v-if="tab === 'about'" class="pane">
            <div class="card block">
                <h2>{{ $t('profile.about') }}</h2>
                <p v-if="user.about" class="about">{{ user.about }}</p>
                <p v-else class="muted empty">
                    {{ $t('profile.aboutEmpty') }}
                    <button class="lnk" @click="tab = 'edit'">{{ $t('profile.fillIt') }}</button>
                </p>
            </div>

            <div class="card block">
                <h2>{{ $t('profile.links') }}</h2>
                <ul class="links">
                    <li v-if="user.website"><span>🌐</span><a :href="user.website" target="_blank" rel="noopener">{{
                            user.website }}</a></li>
                    <li v-if="user.vk"><span>◈</span><a :href="user.vk" target="_blank" rel="noopener">{{ user.vk }}</a>
                    </li>
                    <li v-if="user.telegram"><span>✈</span><span>@{{ user.telegram }}</span></li>
                    <li v-if="!user.website && !user.vk && !user.telegram" class="muted">{{ $t('profile.noLinks') }}
                    </li>
                </ul>
            </div>
        </section>

        <!-- ═════ редактирование ═════ -->
        <section v-else-if="tab === 'edit'" class="pane">
            <div class="card block">
                <h2>{{ $t('profile.tabEdit') }}</h2>
                <div class="form">
                    <label class="f"><span>{{ $t('profile.fName') }}</span><input v-model="form.displayName"
                            :placeholder="$t('profile.fNamePh')"></label>
                    <label class="f"><span>{{ $t('profile.fRole') }}</span><input v-model="form.l4tRole"
                            :placeholder="$t('profile.fRolePh')"></label>
                    <div class="row">
                        <label class="f"><span>{{ $t('profile.fCity') }}</span><input v-model="form.city"
                                placeholder="Москва"></label>
                        <label class="f"><span>{{ $t('profile.fCountry') }}</span><input v-model="form.country"
                                placeholder="Россия"></label>
                    </div>
                    <label class="f"><span>{{ $t('profile.fAbout') }}</span><textarea v-model="form.about" rows="5"
                            :placeholder="$t('profile.fAboutPh')" /></label>
                    <label class="f"><span>{{ $t('profile.fSite') }}</span><input v-model="form.website"
                            placeholder="https://"></label>
                    <label class="f"><span>VK</span><input v-model="form.vk" placeholder="https://vk.com/…"></label>

                    <div class="acts">
                        <button class="btn btn--primary" :disabled="saving" @click="save">
                            {{ saving ? $t('profile.saving') : $t('profile.save') }}
                        </button>
                        <button class="btn" @click="tab = 'about'">{{ $t('profile.cancel') }}</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═════ настройки ═════ -->
        <section v-else class="pane">
            <div class="card block">
                <h2>{{ $t('profile.account') }}</h2>
                <dl class="kv">
                    <div>
                        <dt>{{ $t('auth.email') }}</dt>
                        <dd>{{ user.email }}<span v-if="user.verified" class="ok"> ✓</span></dd>
                    </div>
                    <div>
                        <dt>{{ $t('profile.nick') }}</dt>
                        <dd>{{ user.nick }}</dd>
                    </div>
                    <div>
                        <dt>DustID</dt>
                        <dd>#{{ user.id }}</dd>
                    </div>
                    <div>
                        <dt>{{ $t('profile.role') }}</dt>
                        <dd>{{ roleLabel }}</dd>
                    </div>
                </dl>
            </div>

            <div class="card block">
                <h2>{{ $t('profile.shared') }}</h2>
                <p class="muted note">{{ $t('profile.sharedNote') }}</p>
                <NuxtLink :to="localePath('/settings/accounts')" class="btn btn--sm">
                    ⚿ Связанные аккаунты →
                </NuxtLink>
            </div>

            <div class="card block danger">
                <h2>{{ $t('profile.exit') }}</h2>
                <p class="muted note">{{ $t('profile.exitNote') }}</p>
                <button class="btn btn--out" @click="logout()">{{ $t('islands.logout') }}</button>
            </div>
        </section>

        <!-- ═════ QR ═════ -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="qrOpen" class="qr" @click.self="qrOpen = false">
                    <div class="qr__box pxc">
                        <button class="qr__x" @click="qrOpen = false">✕</button>
                        <h3>{{ $t('profile.qrTitle') }}</h3>
                        <img v-if="qr" :src="qr" alt="QR" class="qr__img">
                        <p class="muted qr__url">{{ profileUrl }}</p>
                        <button class="btn btn--sm" @click="copyLink">{{ $t('profile.copyLink') }}</button>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.pr {
    padding: clamp(14px, 2vw, 24px) clamp(16px, 2.5vw, 30px) 40px;
    display: flex;
    flex-direction: column;
    gap: clamp(16px, 2.5vw, 24px);
}

/* ── шапка ── */
.hero {
    position: relative;
    display: grid;
    gap: 16px;
    padding: clamp(20px, 4vw, 30px);
    background: var(--hero);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
}

.hero__glow {
    position: absolute;
    top: -120px;
    right: -60px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: var(--p);
    filter: blur(80px);
    opacity: .3;
}

.hero__ava {
    position: relative;
    display: grid;
    place-items: center;
    width: 92px;
    height: 92px;
    border-radius: 24px;
    background: var(--p) center/cover;
    color: #fff;
    font-family: var(--f-mono);
    font-weight: 600;
    font-size: 28px;
    border: 2px solid rgba(255, 255, 255, .15);
}

.hero__i {
    position: relative;
    min-width: 0;
}

.hero__i h1 {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: clamp(22px, 5vw, 30px);
}

.hero__name {
    margin: 4px 0 0;
    font-size: 15px;
    color: var(--text-2);
}

.hero__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 12px 0 0;
    font-size: 13px;
}

.hero__act {
    position: relative;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.vfd {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--p);
    color: #fff;
    font-size: 12px;
}

/* ── цифры ── */
.stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 0;
}

.stats>div {
    padding: 14px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
}

.stats dt {
    font-family: var(--f-mono);
    font-size: clamp(15px, 3vw, 19px);
    font-weight: 600;
    color: var(--p);
}

.stats dd {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: var(--text-2);
}

/* ── вкладки ── */
.tabs {
    display: flex;
    gap: 3px;
    padding: 4px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow-x: auto;
    scrollbar-width: none;
}

.tabs button {
    flex: 1;
    min-width: max-content;
    min-height: 38px;
    padding: 0 16px;
    background: none;
    border: none;
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 14px;
}

.tabs button.is-on {
    background: var(--p);
    color: #fff;
}

.pane {
    display: grid;
    gap: 14px;
}

.block {
    padding: clamp(16px, 3vw, 22px);
}

.block h2 {
    font-size: 17px;
    margin-bottom: 12px;
}

.about {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.65;
    white-space: pre-wrap;
}

.empty {
    margin: 0;
    font-size: 14px;
}

.lnk {
    background: none;
    border: none;
    color: var(--p);
    font: inherit;
    text-decoration: underline;
    padding: 0;
}

.links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.links li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
}

.links a {
    color: #66c0f4;
    word-break: break-all;
}

.links a:hover {
    text-decoration: underline;
}

/* ── форма ── */
.form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.f {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.f span {
    font-size: 12px;
    color: var(--text-2);
}

.f input,
.f textarea {
    min-height: var(--tap);
    padding: 10px 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
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

.row {
    display: grid;
    gap: 14px;
}

.acts {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 4px;
}

.kv {
    display: flex;
    flex-direction: column;
    gap: 11px;
    margin: 0;
}

.kv>div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 11px;
    border-bottom: 1px solid var(--border);
}

.kv>div:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.kv dt {
    font-family: var(--f-mono);
    font-size: 11px;
    text-transform: uppercase;
    color: var(--muted);
}

.kv dd {
    margin: 0;
    font-size: 14px;
}

.ok {
    color: #2ecc71;
}

.note {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.5;
}

.danger {
    border-color: rgba(214, 48, 49, .35);
}

.btn--out {
    border-color: rgba(214, 48, 49, .5);
    color: #ff9b9c;
}

.btn--out:hover {
    background: rgba(214, 48, 49, .12);
}

/* ── QR ── */
.qr {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, .7);
    backdrop-filter: blur(6px);
    padding: 20px;
}

.qr__box {
    position: relative;
    padding: 26px;
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    text-align: center;
    max-width: 340px;
    width: 100%;
}

.qr__x {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--muted);
}

.qr__box h3 {
    font-size: 17px;
    margin-bottom: 16px;
}

.qr__img {
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
    border-radius: 12px;
}

.qr__url {
    margin: 14px 0;
    font-family: var(--f-mono);
    font-size: 11px;
    word-break: break-all;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity .25s
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0
}

@media (min-width: 760px) {
    .hero {
        grid-template-columns: 92px 1fr auto;
        align-items: center;
    }

    .stats {
        grid-template-columns: repeat(4, 1fr);
    }

    .row {
        grid-template-columns: 1fr 1fr;
    }

    .tabs button {
        flex: 0 0 auto;
    }
}
</style>