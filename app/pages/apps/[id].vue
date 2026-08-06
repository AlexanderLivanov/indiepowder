<script setup lang="ts">
import { useLocalePath } from '#imports'

/** Страница мобильного приложения/игры — стиль app-store листинга. */

const route = useRoute()
const localePath = useLocalePath()
const { toast } = useToast()

const app = computed(() => findApp(String(route.params.id)))

if (!app.value) throw createError({ statusCode: 404, statusMessage: 'Приложение не найдено', fatal: true })

const a = computed(() => app.value!)
const similar = computed(() => similarApps(a.value))
const priceBtn = computed(() => a.value.price === 0 ? 'Загрузить' : `${a.value.price.toLocaleString('ru-RU')} ₽`)
const platform = computed(() => a.value.platform === 'both' ? 'iOS · Android' : a.value.platform === 'ios' ? 'iOS' : 'Android')

useSeoMeta({
    title: () => `${a.value.name} — Dustore`,
    description: () => a.value.tagline,
})

const installing = ref(false)
function install() {
    installing.value = true
    toast(a.value.price === 0 ? 'Загрузка началась ✦' : 'Открываем оплату…', 'ok')
    setTimeout(() => { installing.value = false }, 1400)
}
function share() {
    const url = location.origin + localePath(`/apps/${a.value.id}`)
    navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована', 'ok'), () => toast(url))
}
</script>

<template>
    <div class="apppage">
        <div class="wrap">
            <NuxtLink :to="localePath('/apps')" class="back">← Мобильные</NuxtLink>

            <!-- шапка -->
            <header class="head">
                <div class="head__icon" :style="{ background: a.icon }"><span>{{ a.glyph }}</span></div>
                <div class="head__main">
                    <h1 class="head__name">{{ a.name }}</h1>
                    <NuxtLink :to="localePath(`/u/${a.developer}`)" class="head__dev">{{ a.developer }}</NuxtLink>
                    <p class="head__tag">{{ a.tagline }}</p>
                    <div class="head__cta">
                        <button class="btn btn--primary get" :disabled="installing" @click="install">{{ priceBtn }}</button>
                        <button class="iconbtn" aria-label="Поделиться" @click="share">⤴</button>
                    </div>
                </div>
            </header>

            <!-- мета-полоса -->
            <div class="meta">
                <div class="meta__cell">
                    <div class="meta__v">{{ a.rating.toFixed(1) }} ★</div>
                    <div class="meta__k">{{ a.ratingCount.toLocaleString('ru-RU') }} оценок</div>
                </div>
                <div class="meta__cell">
                    <div class="meta__v">{{ a.age }}</div>
                    <div class="meta__k">возраст</div>
                </div>
                <div class="meta__cell">
                    <div class="meta__v meta__rank">{{ a.rank ? '#' + a.rank : a.isGame ? 'Игра' : 'Прил.' }}</div>
                    <div class="meta__k">{{ a.rank ? a.category : 'категория' }}</div>
                </div>
                <div class="meta__cell">
                    <div class="meta__v">{{ a.downloads }}</div>
                    <div class="meta__k">загрузок</div>
                </div>
                <div class="meta__cell">
                    <div class="meta__v">{{ platform }}</div>
                    <div class="meta__k">платформа</div>
                </div>
            </div>

            <!-- скриншоты (телефонный формат) -->
            <div class="shots">
                <div v-for="(s, i) in a.shots" :key="i" class="shot" :style="{ background: `linear-gradient(160deg, ${s}, ${a.shots[(i + 1) % a.shots.length]})` }">
                    <div class="shot__glyph">{{ a.glyph }}</div>
                    <div class="shot__bar" />
                </div>
            </div>

            <!-- описание -->
            <section class="sec">
                <p class="desc">{{ a.desc }}</p>
            </section>

            <!-- что нового -->
            <section class="sec">
                <div class="sec__head">
                    <h2>Что нового</h2>
                    <span class="ver">Версия {{ a.version }}</span>
                </div>
                <p class="muted upd">Обновлено {{ a.updated }}</p>
                <p class="whatsnew">{{ a.whatsNew }}</p>
            </section>

            <!-- информация -->
            <section class="sec">
                <h2>Информация</h2>
                <dl class="info">
                    <div><dt>Разработчик</dt><dd><NuxtLink :to="localePath(`/u/${a.developer}`)" class="dd-link">{{ a.developer }}</NuxtLink></dd></div>
                    <div><dt>Размер</dt><dd>{{ a.size }}</dd></div>
                    <div><dt>Категория</dt><dd>{{ a.category }}</dd></div>
                    <div><dt>Совместимость</dt><dd>{{ platform }}</dd></div>
                    <div><dt>Возраст</dt><dd>{{ a.age }}</dd></div>
                    <div><dt>Языки</dt><dd>{{ a.langs.join(', ') }}</dd></div>
                    <div><dt>Цена</dt><dd>{{ a.price === 0 ? 'Бесплатно' : a.price.toLocaleString('ru-RU') + ' ₽' }}</dd></div>
                </dl>
            </section>

            <!-- похожее -->
            <section v-if="similar.length" class="sec">
                <h2>Ещё от разработчика и похожее</h2>
                <div class="simgrid">
                    <AppIconCard v-for="s in similar" :key="s.id" :app="s" />
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.apppage { padding: clamp(16px, 4vw, 28px) 0 48px; }
.back { display: inline-block; margin-bottom: 20px; font-family: var(--f-mono); font-size: 13px; color: var(--text-2); }
.back:hover { color: var(--p); }

/* шапка */
.head { display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap; }
.head__icon {
    width: clamp(88px, 22vw, 118px); aspect-ratio: 1; flex: none; border-radius: 24%;
    display: grid; place-items: center;
    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, .6), inset 0 0 0 1px rgba(255, 255, 255, .08);
}
.head__icon span { font-family: var(--f-display); font-weight: 800; font-size: clamp(36px, 9vw, 52px); color: #fff; }
.head__main { flex: 1; min-width: 220px; }
.head__name { font-size: clamp(22px, 5vw, 30px); }
.head__dev { display: inline-block; margin-top: 4px; font-size: 14px; color: var(--p); }
.head__tag { margin: 8px 0 0; font-size: 14px; color: var(--text-2); }
.head__cta { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.get { min-width: 130px; }
.iconbtn {
    width: 44px; height: 44px; flex: none; border: 1px solid var(--border); border-radius: var(--r);
    background: none; color: var(--text); font-size: 17px;
}
.iconbtn:hover { border-color: var(--p); }

/* мета-полоса */
.meta {
    display: flex; gap: 0; margin: 24px 0; padding: 4px 0;
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    overflow-x: auto;
}
.meta__cell {
    flex: 1; min-width: 92px; padding: 12px 16px; text-align: center;
    border-right: 1px solid var(--border);
}
.meta__cell:last-child { border-right: none; }
.meta__v { font-family: var(--f-display); font-weight: 700; font-size: 16px; white-space: nowrap; }
.meta__rank { color: var(--p); }
.meta__k {
    margin-top: 3px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .04em;
    text-transform: uppercase; color: var(--muted); white-space: nowrap;
}

/* скриншоты */
.shots { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 8px; }
.shot {
    position: relative; flex: none; width: clamp(150px, 42vw, 210px); aspect-ratio: 9 / 19.5;
    border-radius: 26px; border: 1px solid var(--border); overflow: hidden;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, .6);
}
.shot__glyph {
    position: absolute; inset: 0; display: grid; place-items: center;
    font-family: var(--f-display); font-weight: 800; font-size: 56px; color: rgba(255, 255, 255, .28);
}
.shot__bar { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 44px; height: 5px; border-radius: 3px; background: rgba(0, 0, 0, .3); }

/* секции */
.sec { margin-top: 30px; }
.sec__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.sec h2 { font-size: clamp(17px, 4vw, 21px); margin-bottom: 12px; }
.ver { font-family: var(--f-mono); font-size: 12px; color: var(--muted); }
.desc { font-size: 15px; line-height: 1.7; color: var(--text); }
.upd { margin: -6px 0 10px; font-family: var(--f-mono); font-size: 12px; }
.whatsnew { font-size: 14.5px; line-height: 1.65; color: var(--text-2); }

.info { display: grid; grid-template-columns: 1fr; margin: 0; }
.info > div {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    padding: 11px 0; border-top: 1px solid var(--border);
}
.info dt { font-size: 13.5px; color: var(--muted); }
.info dd { margin: 0; font-size: 13.5px; text-align: right; }
.dd-link { color: var(--p); }

.simgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
@media (min-width: 560px) { .simgrid { grid-template-columns: repeat(4, 1fr); gap: 12px; } }
@media (min-width: 900px) { .simgrid { grid-template-columns: repeat(6, 1fr); gap: 14px; } }
</style>
