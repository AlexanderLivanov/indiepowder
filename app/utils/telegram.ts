/**
 * Приводит имя Telegram-бота к чистому username для виджета.
 * Принимает любой формат: "@bot", "https://t.me/bot", "t.me/bot", "bot"
 * → возвращает "bot". Виджету нужен именно голый username, иначе «Username invalid».
 */
export function cleanBotName(v: unknown): string {
  return String(v || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(?:t|telegram)\.me\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
}
