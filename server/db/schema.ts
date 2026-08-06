import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Схема базы `dustore` — ОДНА база на старый и новый сайт.
 *
 * Таблица `users` уже существует и используется старым PHP-сайтом.
 * Мы читаем и пишем в неё же, поэтому вход общий: зарегистрировался
 * на v3 — можешь войти на старом сайте, и наоборот.
 *
 * ⚠️ ПРАВИЛА РАБОТЫ С ОБЩЕЙ ТАБЛИЦЕЙ:
 *   • колонки только ДОБАВЛЯЕМ, и только nullable
 *   • ничего не переименовываем и не удаляем — сломается старый сайт
 *   • типы не меняем
 * Всё новое, что нужно только v3, выносим в отдельные таблицы.
 */

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  // ── вход ──
  username: varchar("username", { length: 190 }),
  email: varchar("email", { length: 190 }),
  password: varchar("password", { length: 255 }), // bcrypt, префикс $2y$ от PHP
  passphrase: varchar("passphrase", { length: 255 }),
  emailVerified: int("email_verified"),
  verificationToken: varchar("verification_token", { length: 255 }),

  // ── профиль ──
  firstName: varchar("first_name", { length: 190 }),
  lastName: varchar("last_name", { length: 190 }),
  profilePicture: varchar("profile_picture", { length: 512 }),
  country: varchar("country", { length: 190 }),
  city: varchar("city", { length: 190 }),
  vk: varchar("vk", { length: 512 }),
  website: varchar("website", { length: 512 }),

  // ── роли ──
  globalRole: int("global_role"), // -1 root, 3 модератор
  localRole: varchar("local_role", { length: 190 }),
  role: varchar("role", { length: 64 }),

  // ── telegram ──
  telegramId: bigint("telegram_id", { mode: "number" }),
  telegramToken: text("telegram_token"),
  telegramUsername: varchar("telegram_username", { length: 190 }),
  authDate: bigint("auth_date", { mode: "number" }),

  // ── L4T ──
  l4tRole: varchar("l4t_role", { length: 255 }),
  l4tExp: text("l4t_exp"),
  l4tFiles: text("l4t_files"),
  l4tProjects: text("l4t_projects"),
  l4tAbout: text("l4t_about"),

  // ── счётчики ──
  votesUp: int("votes_up"),
  votesDown: int("votes_down"),
  profileViews: int("profile_views"),

  // ── даты ──
  added: datetime("added"),
  updated: datetime("updated"),
  lastActivity: datetime("last_activity"),
});

/**
 * НОВАЯ таблица только для v3: вход через сервисы.
 * Старый сайт о ней не знает — создавать безопасно.
 */
export const userIdentities = mysqlTable(
  "user_identities",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    userId: int("user_id").notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerUid: varchar("provider_uid", { length: 190 }).notNull(),
    email: varchar("email", { length: 190 }),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => ({
    provIdx: index("idx_identity_provider").on(t.provider, t.providerUid),
    userIdx: index("idx_identity_user").on(t.userId),
  }),
);

/**
 * НОВАЯ таблица только для v3: посты ленты вдохновения (раздел /feed).
 * Портировано из проекта StayInspired. Старый сайт о ней не знает —
 * создавать безопасно. Автор поста ссылается на users.id (nullable —
 * демо-посты сида автора не имеют).
 */
export const feedPosts = mysqlTable(
  "feed_posts",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    // тип карточки: spark | note | article | line | thread
    kind: varchar("kind", { length: 16 }).notNull().default("note"),
    authorId: int("author_id"), // users.id, либо null у демо/сида
    authorName: varchar("author_name", { length: 190 }).notNull(),
    authorHandle: varchar("author_handle", { length: 190 }).notNull(),
    title: varchar("title", { length: 200 }), // только для article
    body: text("body"), // текст поста / excerpt статьи
    content: text("content"), // полный текст статьи (абзацы через \n\n)
    mediaType: varchar("media_type", { length: 16 }), // image | video | null
    mediaLabel: varchar("media_label", { length: 190 }),
    up: int("up").notNull().default(0),
    replies: int("replies").notNull().default(0),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => ({
    createdIdx: index("idx_feed_created").on(t.createdAt),
    authorIdx: index("idx_feed_author").on(t.authorId),
  }),
);

export type FeedPostRow = typeof feedPosts.$inferSelect;
export type NewFeedPost = typeof feedPosts.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/** старая числовая роль → понятная строка */
export function roleName(globalRole: number | null): string {
  if (globalRole === -1) return "root";
  if (globalRole === 3) return "moder";
  return "user";
}
