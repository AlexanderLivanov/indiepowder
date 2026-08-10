import { and, eq } from "drizzle-orm";
import { hasDb, useDb } from "../db/client";
import { userIdentities } from "../db/schema";
import { withDbFallback } from "./dbFallback";

/**
 * Привязки способов входа к аккаунту (таблица user_identities).
 * Одна строка = один внешний провайдер у пользователя.
 * Уникальность (provider, provider_uid) гарантирует, что «войти через Telegram»
 * всегда приводит к тому же аккаунту, а не создаёт новый.
 *
 * Как и store.ts, работает с DB и деградирует в память при недоступной базе.
 */

export type ProviderId = "yandex" | "vk" | "telegram";

export interface Identity {
  provider: ProviderId;
  uid: string;
  email: string | null;
  createdAt: string;
}

/* ─────────── запасной режим без базы ─────────── */
interface MemRow extends Identity {
  userId: number;
}
const mem: MemRow[] = [];

/* ─────────── операции ─────────── */
export const useIdentities = () => ({
  /** userId по (провайдер, внешний id) — основа входа через сервис */
  async userIdByProvider(
    provider: ProviderId,
    uid: string,
  ): Promise<number | null> {
    const memFn = () =>
      mem.find((r) => r.provider === provider && r.uid === uid)?.userId ?? null;
    if (!hasDb()) return memFn();
    return withDbFallback(async () => {
      const rows: any[] = await useDb()
        .select()
        .from(userIdentities)
        .where(
          and(
            eq(userIdentities.provider, provider),
            eq(userIdentities.providerUid, uid),
          ),
        )
        .limit(1);
      return rows[0] ? Number(rows[0].userId) : null;
    }, memFn);
  },

  /** привязать провайдера к аккаунту (идемпотентно) */
  async link(
    userId: number,
    provider: ProviderId,
    uid: string,
    email: string | null,
  ): Promise<void> {
    const memFn = () => {
      const existing = mem.find(
        (r) => r.provider === provider && r.uid === uid,
      );
      if (existing) {
        existing.userId = userId;
        existing.email = email;
      } else {
        mem.push({
          userId,
          provider,
          uid,
          email,
          createdAt: new Date().toISOString(),
        });
      }
    };
    if (!hasDb()) return memFn();
    await withDbFallback(async () => {
      const rows: any[] = await useDb()
        .select()
        .from(userIdentities)
        .where(
          and(
            eq(userIdentities.provider, provider),
            eq(userIdentities.providerUid, uid),
          ),
        )
        .limit(1);
      if (rows[0]) {
        await useDb()
          .update(userIdentities)
          .set({ userId, email })
          .where(eq(userIdentities.id, rows[0].id));
      } else {
        await useDb().insert(userIdentities).values({
          userId,
          provider,
          providerUid: uid,
          email,
        });
      }
    }, memFn);
  },

  /** список привязок аккаунта — для страницы «Связанные аккаунты» */
  async listForUser(userId: number): Promise<Identity[]> {
    const memFn = () =>
      mem
        .filter((r) => r.userId === userId)
        .map(({ provider, uid, email, createdAt }) => ({
          provider,
          uid,
          email,
          createdAt,
        }));
    if (!hasDb()) return memFn();
    return withDbFallback(async () => {
      const rows: any[] = await useDb()
        .select()
        .from(userIdentities)
        .where(eq(userIdentities.userId, userId));
      return rows.map((r) => ({
        provider: r.provider as ProviderId,
        uid: r.providerUid,
        email: r.email ?? null,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : new Date().toISOString(),
      }));
    }, memFn);
  },

  /** отвязать провайдера от аккаунта */
  async unlink(userId: number, provider: ProviderId): Promise<void> {
    const memFn = () => {
      for (let i = mem.length - 1; i >= 0; i--) {
        if (mem[i]!.userId === userId && mem[i]!.provider === provider)
          mem.splice(i, 1);
      }
    };
    if (!hasDb()) return memFn();
    await withDbFallback(async () => {
      await useDb()
        .delete(userIdentities)
        .where(
          and(
            eq(userIdentities.userId, userId),
            eq(userIdentities.provider, provider),
          ),
        );
    }, memFn);
  },
});
