import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  datetime,
  date,
  timestamp,
  tinyint,
  float,
  decimal,
  mysqlEnum,
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

/**
 * СУЩЕСТВУЮЩАЯ прод-таблица `games` (её создал старый сайт) — как и `users`,
 * мы её только ЧИТАЕМ и НЕ создаём миграцией. Объявлены лишь те колонки,
 * что нужны витрине; остальные колонки БД Drizzle просто игнорирует при select.
 *
 * ⚠️ Если запустите `drizzle-kit generate` — он предложит СОЗДАТЬ эту таблицу.
 *    Такую миграцию применять НЕ нужно (таблица уже есть на проде).
 */
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  badge: int("badge"),
  developer: int("developer"), // id студии-разработчика
  publisher: int("publisher"),
  name: text("name"),
  genre: varchar("genre", { length: 50 }),
  shortDescription: text("short_description"),
  description: text("description"),
  platforms: varchar("platforms", { length: 100 }),
  // даты — строками: в проде встречается '0000-00-00', Date-конверсия падает
  releaseDate: date("release_date", { mode: "string" }),
  pathToCover: varchar("path_to_cover", { length: 255 }),
  gameWebsite: varchar("game_website", { length: 255 }),
  status: mysqlEnum("status", ["draft", "published", "closed"]).notNull(),
  gqi: tinyint("GQI", { unsigned: true }), // индекс качества 0-100
  ratingBoost: float("rating_boost"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  bannerUrl: varchar("banner_url", { length: 255 }),
  iconUrl: varchar("icon_url", { length: 255 }),
  trailerUrl: varchar("trailer_url", { length: 255 }),
  ratingCount: int("rating_count"),
  features: text("features"),
  screenshots: text("screenshots"),
  requirements: text("requirements"),
  languages: varchar("languages", { length: 100 }),
  ageRating: varchar("age_rating", { length: 20 }),
  achievements: text("achievements"),
  price: decimal("price", { precision: 10, scale: 2 }),
  inSubscription: tinyint("in_subscription"),
});

export type GameRow = typeof games.$inferSelect;

/**
 * НОВЫЕ v3-таблицы: доп-файлы игры (саундтрек/артбук/README) и версии сборок.
 * Старый сайт о них не знает — создавать безопасно (см. миграцию 0002).
 */
export const gameFiles = mysqlTable(
  "game_files",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    gameId: int("game_id").notNull(),
    // game | soundtrack | artbook | readme | extra
    kind: varchar("kind", { length: 16 }).notNull().default("extra"),
    title: varchar("title", { length: 190 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    size: int("size"), // байт
    sort: int("sort").notNull().default(0),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => ({ gameIdx: index("idx_gamefiles_game").on(t.gameId) }),
);

export const gameVersions = mysqlTable(
  "game_versions",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    gameId: int("game_id").notNull(),
    version: varchar("version", { length: 64 }).notNull(),
    // stable | ptb | old
    channel: varchar("channel", { length: 16 }).notNull().default("stable"),
    url: varchar("url", { length: 500 }).notNull(),
    size: int("size"),
    notes: text("notes"),
    isCurrent: tinyint("is_current").notNull().default(0),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => ({ gameIdx: index("idx_gameversions_game").on(t.gameId) }),
);

export type GameFileRow = typeof gameFiles.$inferSelect;
export type GameVersionRow = typeof gameVersions.$inferSelect;

/**
 * СУЩЕСТВУЮЩАЯ прод-таблица `studios` (студии-разработчики). Только читаем,
 * миграцией НЕ создаём. games.developer ссылается на studios.id.
 * Объявлены только колонки, нужные витрине/консоли.
 */
export const studios = mysqlTable("studios", {
  id: int("id").autoincrement().primaryKey(),
  status: varchar("status", { length: 32 }),
  name: text("name"),
  tiker: varchar("tiker", { length: 32 }),
  ownerId: int("owner_id"),
  description: text("description"),
  avatarLink: text("avatar_link"),
  bannerLink: text("banner_link"),
  vkLink: varchar("vk_link", { length: 500 }),
  tgLink: varchar("tg_link", { length: 500 }),
  website: varchar("website", { length: 500 }),
  country: varchar("country", { length: 190 }),
  city: varchar("city", { length: 190 }),
  foundationDate: date("foundation_date", { mode: "string" }),
  teamSize: varchar("team_size", { length: 20 }),
  specialization: varchar("specialization", { length: 50 }),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export type StudioRow = typeof studios.$inferSelect;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/** старая числовая роль → понятная строка */
export function roleName(globalRole: number | null): string {
  if (globalRole === -1) return "root";
  if (globalRole === 3) return "moder";
  return "user";
}
