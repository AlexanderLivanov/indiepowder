import type { DbGame } from '~~/server/db/games'

/**
 * Реальные игры из БД (таблица games), приведённые к форме `Game`,
 * которую ждут витрины (GameCard, каталог, главная).
 * Обложка/скриншоты у реальных игр — это ссылки, поэтому кладём их
 * как CSS-фон `url(...)`. Если игр в БД нет — вызывающий откатывается на демо.
 */

function bg(url: string | null): string {
    return url ? `url("${url}") center / cover no-repeat` : '#20082b'
}

export function dbGameToGame(r: DbGame): Game {
    const d = r.releaseDate ? Number(r.releaseDate.replace(/-/g, '')) : 0
    const shots = r.screenshots.length ? r.screenshots.map(bg) : [bg(r.cover)]
    return {
        id: r.id,
        title: r.name,
        author: r.developerName || '—',
        tags: [genreLabel(r.genre), ...r.platforms.map(platformLabel)].filter(Boolean) as string[],
        plays: r.downloads,
        shows: 0,
        rating: r.rating,
        gqi: r.gqi ?? undefined,
        votes: r.ratingCount,
        price: r.price,
        cover: bg(r.icon || r.cover),
        date: d,
        engine: platformLabel(r.platforms[0]) || '—',
        size: '—',
        web: false,
        desc: r.shortDescription || r.description.slice(0, 140),
        shortDescription: r.shortDescription,
        about: r.description || r.shortDescription,
        shots,
    }
}

/** computed со списком реальных игр (пустой, если БД недоступна/пуста) */
export async function useRealGames() {
    const { data } = await useFetch<{ games: DbGame[] }>('/api/games', {
        key: 'real-games',
        default: () => ({ games: [] }),
    })
    return computed<Game[]>(() => (data.value?.games ?? []).map(dbGameToGame))
}
