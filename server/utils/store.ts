import { hashPassword, verifyPassword } from "./password";

/**
 * Хранилище пользователей.
 *
 * Пока DATABASE_URL не задан — работает в памяти, чтобы можно было
 * щупать вход локально без установки MySQL. Как только строка появится
 * в .env, переключаем на реальную базу (see: server/db/client.ts).
 */

export interface SessionUser {
  id: number;
  nick: string;
  email: string;
  role: string;
  verified: boolean;
  avatarUrl: string | null;
  newsletter: boolean;
  pushEnabled: boolean;
  // витринные счётчики, позже приедут из своих таблиц
  games: number;
  hours: number;
  friends: number;
}

interface Row extends SessionUser {
  passwordHash: string | null;
  legacyId: number | null;
}

const mem: Row[] = [];
let seq = 1;

/** демо-аккаунт, чтобы было чем войти сразу: demo@dustore.ru / demo1234 */
async function seed() {
  if (mem.length) return;
  mem.push({
    id: seq++,
    nick: "demo",
    email: "demo@dustore.ru",
    passwordHash: await hashPassword("demo1234"),
    legacyId: null,
    role: "user",
    verified: true,
    avatarUrl: null,
    newsletter: true,
    pushEnabled: false,
    games: 12,
    hours: 148,
    friends: 23,
  });
}

export const useStore = () => ({
  async findByEmail(email: string) {
    await seed();
    return (
      mem.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
    );
  },

  async findByNick(nick: string) {
    await seed();
    return mem.find((u) => u.nick.toLowerCase() === nick.toLowerCase()) || null;
  },

  async findById(id: number) {
    await seed();
    return mem.find((u) => u.id === id) || null;
  },

  async create(data: {
    nick: string;
    email: string;
    password?: string;
    legacyId?: number;
  }) {
    await seed();
    const row: Row = {
      id: seq++,
      nick: data.nick,
      email: data.email,
      passwordHash: data.password ? await hashPassword(data.password) : null,
      legacyId: data.legacyId ?? null,
      role: "user",
      verified: false,
      avatarUrl: null,
      newsletter: false,
      pushEnabled: false,
      games: 0,
      hours: 0,
      friends: 0,
    };
    mem.push(row);
    return row;
  },

  async checkPassword(row: Row, plain: string) {
    return verifyPassword(plain, row.passwordHash);
  },
});

/** то, что безопасно отдавать в браузер (без хеша пароля) */
export function publicUser(u: Row | SessionUser): SessionUser {
  const {
    id,
    nick,
    email,
    role,
    verified,
    avatarUrl,
    newsletter,
    pushEnabled,
    games,
    hours,
    friends,
  } = u as Row;
  return {
    id,
    nick,
    email,
    role,
    verified,
    avatarUrl,
    newsletter,
    pushEnabled,
    games,
    hours,
    friends,
  };
}
