/// <reference types="node" />
import type { Config } from "drizzle-kit";

// Схема НОВОЙ базы dustorev3. Старые таблицы (server/db/legacy.ts)
// сюда не подключены специально — они уже существуют на проде.

const url = process.env.DATABASE_URL;

if (!url) {
  console.error(`
╔══════════════════════════════════════════════════════════╗
║  DATABASE_URL не задан                                   ║
╚══════════════════════════════════════════════════════════╝

Создай файл .env в корне проекта (рядом с package.json):

    DATABASE_URL="mysql://root:@localhost:3306/dustorev3"
    NUXT_SESSION_SECRET="длинная-случайная-строка-32-символа"

И убедись, что база уже создана — drizzle её НЕ создаёт:

    CREATE DATABASE dustorev3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`);
  process.exit(1);
}

export default {
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
} satisfies Config;
