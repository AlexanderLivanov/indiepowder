<script setup lang="ts">
import { useI18n } from '#imports'

/**
 * Ловит ВСЕ ещё не сделанные разделы одним файлом.
 * Плановые разделы показывают «в разработке», всё остальное — честная 404.
 * Так навигация не сыплет ошибками в консоль, пока страниц физически нет.
 */
const route = useRoute()
const { t } = useI18n()

const PLANNED: Record<string, string> = {
    assets: '▦', jams: '⏱', crews: '◈', devlogs: '✎', bugs: '▣',
    console: '⚙', ether: '◇', profile: '◐', library: '▤', bookmarks: '☆',
    history: '↺', collections: '▩', spawn: '◉', l4t: '▲', foryou: '✦',
    new: '✧', popular: '▲', free: '◇',
}

const slug = computed(() => {
    const parts = route.path.replace(/^\/en/, '').split('/').filter(Boolean)
    return parts[0] || ''
})

const icon = computed(() => PLANNED[slug.value])

if (!icon.value) {
    throw createError({ statusCode: 404, statusMessage: 'Страница не найдена', fatal: true })
}

const title = computed(() => t(`soon.${slug.value}`, slug.value))
const text = computed(() => t(`soon.${slug.value}_d`, t('soon.generic')))

useSeoMeta({ title: () => `${title.value} — Dustore` })
</script>

<template>
    <ComingSoon :icon="icon!" :title="title" :text="text" />
</template>