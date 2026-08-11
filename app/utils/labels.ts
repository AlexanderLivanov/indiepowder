/** Русские названия жанров и платформ (коды из БД → человекочитаемо). */

const GENRES: Record<string, string> = {
  other: 'Другое', action: 'Экшен', adventure: 'Приключение', rpg: 'РПГ',
  simulator: 'Симулятор', simulation: 'Симулятор', strategy: 'Стратегия',
  visnovel: 'Новелла', novel: 'Новелла', table: 'Настолка', indie: 'Инди',
  platformer: 'Платформер', puzzle: 'Головоломка', horror: 'Хоррор',
  arcade: 'Аркада', shooter: 'Шутер', racing: 'Гонки', sport: 'Спорт',
  fighting: 'Файтинг', music: 'Музыка', card: 'Карточная', casual: 'Казуальная',
  sandbox: 'Песочница', metroidvania: 'Метроидвания', roguelike: 'Рогалик',
}

const PLATFORMS: Record<string, string> = {
  windows: 'Windows', linux: 'Linux', macos: 'macOS', mac: 'macOS',
  android: 'Android', ios: 'iOS', web: 'Веб', pc: 'ПК', console: 'Консоли', vr: 'VR',
}

/** жанр → рус. (уже русское / незнакомое — оставляем как есть) */
export function genreLabel(g?: string | null): string {
  if (!g) return ''
  return GENRES[g.trim().toLowerCase()] || g
}

/** платформа → рус. */
export function platformLabel(p?: string | null): string {
  if (!p) return ''
  return PLATFORMS[p.trim().toLowerCase()] || p
}

/** тег может быть жанром или платформой — переводим то, что знаем */
export function tagLabel(t: string): string {
  const k = t.trim().toLowerCase()
  return GENRES[k] || PLATFORMS[k] || t
}
