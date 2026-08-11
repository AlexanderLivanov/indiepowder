<script setup lang="ts">
import { useLocalePath } from '#imports'

definePageMeta({ layout: 'console' })

/** Заглушка для ещё не перенесённых разделов консоли (навигация и дизайн уже на месте). */
const route = useRoute()
const localePath = useLocalePath()

const LABELS: Record<string, string> = {
    new: 'Новый проект', edit: 'Редактор проекта', events: 'События', wishlists: 'Вишлисты',
    replies: 'Ответы на отзывы', 'expert-reviews': 'Экспертные обзоры', analytics: 'Аналитика',
    monetization: 'Монетизация', mystudio: 'Моя студия', staff: 'Сотрудники', select: 'Сменить студию',
}
const section = computed(() => String(route.params.section || ''))
const label = computed(() => LABELS[section.value] || 'Раздел')

useSeoMeta({ title: () => `${label.value} — Dustore.Devs` })
</script>

<template>
    <div class="soon">
        <div class="card soon__box">
            <span class="material-icons">construction</span>
            <h2>{{ label }}</h2>
            <p class="muted">Этот раздел консоли ещё переносим в новую версию. Дизайн и навигация уже на месте —
                функциональность подключим следующей.</p>
            <NuxtLink :to="localePath('/console')" class="btn btn--sm">← К обзору</NuxtLink>
        </div>
    </div>
</template>

<style scoped>
.soon { display: grid; place-items: center; min-height: 60vh; }
.soon__box { max-width: 460px; padding: 40px 30px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.soon__box .material-icons { font-size: 48px; color: var(--p); }
.soon__box h2 { font-family: var(--f-display); font-size: 22px; }
.soon__box p { font-size: 14px; line-height: 1.55; margin: 0; }
.soon__box .btn { margin-top: 8px; }
</style>
