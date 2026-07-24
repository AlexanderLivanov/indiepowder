import {
  mysqlTable,
  varchar,
  int,
  bigint,
  boolean,
  timestamp,
  text,
  index,
} from "drizzle-orm/mysql-core";

/* ═══════════════════════════════════════════════════════════
   СТРАТЕГИЯ ПЕРЕЕЗДА: две таблицы рядом.

   `users`      — СТАРАЯ таблица Dustore v2. НЕ ТРОГАЕМ, только читаем.
   `dust_users` — новая. Сюда попадают новые регистрации,
                  а старые аккаунты переезжают лениво: при первом
                  успешном входе. Пользователь ничего не замечает.

   Так мы не делаем рискованный разовый перенос всей базы
   и в любой момент можем откатиться на старый сайт.
   ═══════════════════════════════════════════════════════════ */

/** СТАРАЯ таблица. Описание должно совпадать с боевой схемой 1:1. */
export const legacyUsers = mysqlTable("users", {
  id: int("id").primaryKey(), // signed INT — как есть в v2
  login: varchar("login", { length: 190 }),
  email: varchar("email", { length: 190 }),
  password: varchar("password", { length: 255 }), // хеш от PHP password_hash()
  telegramId: varchar("telegram_id", { length: 64 }), // VARCHAR в v2
  role: int("role"), // -1 root, 3 модератор
  avatar: varchar("avatar", { length: 512 }),
  createdAt: timestamp("created_at"),
  // сюда допишем реальные колонки после drizzle-kit pull
});

/** НОВАЯ таблица — единый профиль DustID */
export const dustUsers = mysqlTable(
  "dust_users",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),

    // кто это
    nick: varchar("nick", { length: 32 }).notNull().unique(),
    email: varchar("email", { length: 190 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }), // null, если вход только через сервис

    // связь со старым аккаунтом
    legacyId: int("legacy_id"), // id из users, если переехал
    migratedAt: timestamp("migrated_at"),

    // профиль
    displayName: varchar("display_name", { length: 64 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    bio: text("bio"),
    role: varchar("role", { length: 16 }).default("user").notNull(), // user | moder | root
    verified: boolean("verified").default(false).notNull(),

    // подписки — управляются из профиля
    newsletter: boolean("newsletter").default(false).notNull(),
    pushEnabled: boolean("push_enabled").default(false).notNull(),

    emailVerified: boolean("email_verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at"),
  },
  (t) => ({
    emailIdx: index("idx_dust_users_email").on(t.email),
    legacyIdx: index("idx_dust_users_legacy").on(t.legacyId),
  }),
);

/** привязка входа через сервисы (Яндекс, VK, Telegram…) */
export const dustIdentities = mysqlTable(
  "dust_identities",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(), // yandex | vk | telegram …
    providerUid: varchar("provider_uid", { length: 190 }).notNull(),
    email: varchar("email", { length: 190 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    provIdx: index("idx_identity_provider").on(t.provider, t.providerUid),
    userIdx: index("idx_identity_user").on(t.userId),
  }),
);

export type DustUser = typeof dustUsers.$inferSelect;
export type NewDustUser = typeof dustUsers.$inferInsert;
