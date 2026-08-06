<script setup lang="ts">
import { useI18n } from '#imports'

/**
 * Ловит все ещё не сделанные разделы одним файлом.
 * Плановые разделы показывают «в разработке», всё остальное — честная 404.
 */
const route = useRoute()
const { t, te } = useI18n()

const PLANNED: Record<string, string> = {
    assets: '▦', jams: '⏱', crews: '◈', devlogs: '✎', bugs: '▣',
    console: '⚙', library: '▤', bookmarks: '☆',
    history: '↺', collections: '▩', spawn: '◉', l4t: '▲', foryou: '✦',
    new: '✧', popular: '▲', free: '◇',
}

const path = computed(() => route.path.replace(/^\/en/, ''))
const slug = computed(() => path.value.split('/').filter(Boolean)[0] || '')

// файлы (.png, .js, .map…) не должны рендерить страницу — это просто отсутствующий файл
const looksLikeFile = computed(() => /\.[a-z0-9]{2,5}$/i.test(path.value))

const icon = computed(() => PLANNED[slug.value])
const known = computed(() => Boolean(icon.value) && !looksLikeFile.value)

if (!known.value) {
    throw createError({
        statusCode: 404,
        message: looksLikeFile.value ? 'Файл не найден' : 'Страница не найдена',
        fatal: true,
    })
}

// te() проверяет, есть ли такой ключ — иначе берём общий текст
const title = computed(() => te(`soon.${slug.value}`) ? t(`soon.${slug.value}`) : slug.value)
const text = computed(() => te(`soon.${slug.value}_d`) ? t(`soon.${slug.value}_d`) : t('soon.generic'))

useSeoMeta({ title: () => `${title.value} — Dustore` })
</script>

<template>
    <!-- v-if обязателен: без него Vue успевает отрисовать компонент
       с пустыми пропсами до того, как сработает createError -->
    <ComingSoon v-if="known" :icon="icon!" :title="title" :text="text" />
</template>