/**
 * Отказоустойчивость БД. Инвариант: «пробуй базу, деградируй при отказе».
 *
 * hasDb() говорит лишь, что DATABASE_URL задан — но заданный URL ≠ живая база.
 * Если MySQL не запущен/недоступен, драйвер бросает ECONNREFUSED и роняет
 * запрос 500-й. Оборачиваем обращения к БД так, чтобы при ошибке соединения
 * приложение продолжало работать на запасном режиме (память/сид), а не падало.
 */

const CONN_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "PROTOCOL_CONNECTION_LOST",
  "ER_BAD_DB_ERROR", // база не создана — тоже «недоступна» для нас
  "ER_ACCESS_DENIED_ERROR",
]);

export function isDbConnError(e: any): boolean {
  const code =
    e?.code || e?.cause?.code || e?.errors?.[0]?.code || e?.errors?.[0]?.errno;
  if (code && CONN_CODES.has(String(code))) return true;
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET/.test(
    String(e?.message || ""),
  );
}

/** попытаться выполнить запрос к БД; при ошибке соединения — запасной путь */
export async function withDbFallback<T>(
  dbFn: () => Promise<T>,
  fallback: () => Promise<T> | T,
): Promise<T> {
  try {
    return await dbFn();
  } catch (e) {
    if (isDbConnError(e)) return await fallback();
    throw e;
  }
}
