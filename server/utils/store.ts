import { eq, sql as raw } from "drizzle-orm";
import { hasDb, useDb } from "../db/client";
import { users, roleName } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";

/**
 * Работа с пользователями. Таблица одна — `users` в базе `dustore`,
 * та же, что у старого сайта. Вход общий для обеих версий.
 */

export interface SessionUser {
  id: number;
  nick: string;
  email: string;
  role: string;
  verified: boolean;
  avatarUrl: string | null;
  displayName: string | null;
  city: string | null;
  country: string | null;
  about: string | null;
  website: string | null;
  vk: string | null;
  telegram: string | null;
  l4tRole: string | null;
  registered: string | null;
  votesUp: number;
  votesDown: number;
  profileViews: number;
}

export interface Row extends SessionUser {
  passwordHash: string | null;
}

/* ─────────── запасной режим без базы ─────────── */
const mem: Row[] = [];
let seq = 1;

function blank(): Omit<SessionUser, "id" | "nick" | "email"> {
  return {
    role: "user",
    verified: false,
    avatarUrl: null,
    displayName: null,
    city: null,
    country: null,
    about: null,
    website: null,
    vk: null,
    telegram: null,
    l4tRole: null,
    registered: null,
    votesUp: 0,
    votesDown: 0,
    profileViews: 0,
  };
}

async function seedMem() {
  if (mem.length) return;
  mem.push({
    id: seq++,
    nick: "demo",
    email: "demo@dustore.ru",
    passwordHash: await hashPassword("demo1234"),
    ...blank(),
    verified: true,
  });
}

/* ─────────── строка БД → наш объект ─────────── */
function fromDb(r: any): Row {
  return {
    id: Number(r.id),
    nick: r.username || r.telegramUsername || `user${r.id}`,
    email: r.email || "",
    passwordHash: r.password ?? null,
    role: roleName(r.globalRole),
    verified:
      r.globalRole === -1 || r.globalRole === 3 || Boolean(r.emailVerified),
    avatarUrl: r.profilePicture ?? null,
    displayName: [r.firstName, r.lastName].filter(Boolean).join(" ") || null,
    city: r.city ?? null,
    country: r.country ?? null,
    about: r.l4tAbout ?? null,
    website: r.website ?? null,
    vk: r.vk ?? null,
    telegram: r.telegramUsername ?? null,
    l4tRole: r.l4tRole ?? null,
    registered: r.added ? new Date(r.added).toISOString() : null,
    votesUp: Number(r.votesUp ?? 0),
    votesDown: Number(r.votesDown ?? 0),
    profileViews: Number(r.profileViews ?? 0),
  };
}

export const useStore = () => ({
  async findByEmail(email: string): Promise<Row | null> {
    if (!hasDb()) {
      await seedMem();
      return (
        mem.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
      );
    }
    const rows: any[] = await useDb()
      .select()
      .from(users)
      .where(raw`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return rows[0] ? fromDb(rows[0]) : null;
  },

  async findByNick(nick: string): Promise<Row | null> {
    if (!hasDb()) {
      await seedMem();
      return (
        mem.find((u) => u.nick.toLowerCase() === nick.toLowerCase()) || null
      );
    }
    const rows: any[] = await useDb()
      .select()
      .from(users)
      .where(raw`lower(${users.username}) = ${nick.toLowerCase()}`)
      .limit(1);
    return rows[0] ? fromDb(rows[0]) : null;
  },

  async findById(id: number): Promise<Row | null> {
    if (!hasDb()) {
      await seedMem();
      return mem.find((u) => u.id === id) || null;
    }
    const rows: any[] = await useDb()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ? fromDb(rows[0]) : null;
  },

  /** новые регистрации идут в ту же таблицу, что и у старого сайта */
  async create(data: {
    nick: string;
    email: string;
    password?: string;
  }): Promise<Row> {
    const passwordHash = data.password
      ? await hashPassword(data.password)
      : null;

    if (!hasDb()) {
      await seedMem();
      const row: Row = {
        id: seq++,
        nick: data.nick,
        email: data.email.toLowerCase(),
        passwordHash,
        ...blank(),
      };
      mem.push(row);
      return row;
    }

    const now = new Date();
    await useDb().insert(users).values({
      username: data.nick,
      email: data.email.toLowerCase(),
      password: passwordHash,
      globalRole: 0,
      role: "user",
      emailVerified: 0,
      votesUp: 0,
      votesDown: 0,
      profileViews: 0,
      added: now,
      updated: now,
      lastActivity: now,
    });

    const created = await this.findByEmail(data.email);
    if (!created) throw new Error("не удалось создать пользователя");
    return created;
  },

  /** обновление профиля из личного кабинета */
  async updateProfile(
    id: number,
    patch: {
      displayName?: string;
      city?: string;
      country?: string;
      about?: string;
      website?: string;
      vk?: string;
      l4tRole?: string;
    },
  ): Promise<Row | null> {
    if (!hasDb()) {
      const row = mem.find((u) => u.id === id);
      if (row) Object.assign(row, patch);
      return row || null;
    }

    const set: Record<string, unknown> = { updated: new Date() };
    if (patch.displayName !== undefined) {
      const [first, ...rest] = patch.displayName.trim().split(/\s+/);
      set.firstName = first || null;
      set.lastName = rest.join(" ") || null;
    }
    if (patch.city !== undefined) set.city = patch.city || null;
    if (patch.country !== undefined) set.country = patch.country || null;
    if (patch.about !== undefined) set.l4tAbout = patch.about || null;
    if (patch.website !== undefined) set.website = patch.website || null;
    if (patch.vk !== undefined) set.vk = patch.vk || null;
    if (patch.l4tRole !== undefined) set.l4tRole = patch.l4tRole || null;

    await useDb().update(users).set(set).where(eq(users.id, id));
    return this.findById(id);
  },

  async touchActivity(id: number) {
    if (!hasDb()) return;
    try {
      await useDb()
        .update(users)
        .set({ lastActivity: new Date() })
        .where(eq(users.id, id));
    } catch {
      /* не критично */
    }
  },

  async checkPassword(row: Row, plain: string) {
    return verifyPassword(plain, row.passwordHash);
  },
});

export function publicUser(u: Row): SessionUser {
  const { passwordHash, ...rest } = u;
  return rest;
}
