import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Подключение к MySQL. Пул создаётся один раз на процесс.
 * Если DATABASE_URL не задан — база не используется (см. server/utils/store.ts).
 */

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан");
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    charset: "utf8mb4_unicode_ci", // одинаковая кодировка везде — иначе кириллица поедет
    // legacy-данные содержат '0000-00-00' и кривые даты — если драйвер попытается
    // сконвертировать их в JS Date, запрос упадёт. Отдаём даты строками.
    dateStrings: true,
  });
  return drizzle(pool, { schema, mode: "default" });
}

// кешируем на глобальном объекте, чтобы не плодить пулы при hot-reload
const g = globalThis as unknown as { __dustoreDb?: ReturnType<typeof connect> };

export function useDb() {
  if (!g.__dustoreDb) g.__dustoreDb = connect();
  return g.__dustoreDb;
}
