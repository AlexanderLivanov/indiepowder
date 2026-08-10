import { useStore } from "./store";
import { useIdentities } from "./identities";
import { validEmail, validNick } from "./password";
import type { OAuthProfile } from "./oauth";

/**
 * Сведение внешнего входа к ОДНОМУ аккаунту.
 *
 * Правила (чтобы не плодить дубли):
 *   1. привязка уже есть → это тот же аккаунт, входим в него;
 *   2. в сессии кто-то есть → привязываем провайдера к текущему аккаунту;
 *   3. провайдер дал email, совпадающий с существующим → привязываем к нему (слияние);
 *   4. есть email, аккаунта нет → создаём новый (пароль не нужен, вход через сервис);
 *   5. email нет (Telegram у нового пользователя) → { needEmail } — спросим почту.
 */

export type ResolveResult =
  | { status: "ok"; userId: number; created?: boolean; merged?: boolean }
  | { status: "needEmail" }
  | { status: "conflict" };

/** уникальный ник из имени/логина провайдера */
async function uniqueNick(seed: string): Promise<string> {
  const store = useStore();
  let base = (seed || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "")
    .slice(0, 24);
  if (!validNick(base)) base = "user" + Math.floor(Math.random() * 9000 + 1000);
  let nick = base;
  for (let i = 0; i < 50; i++) {
    if (!(await store.findByNick(nick))) return nick;
    nick = `${base}${Math.floor(Math.random() * 9000 + 1000)}`.slice(0, 32);
  }
  return `${base}${Date.now().toString().slice(-5)}`.slice(0, 32);
}

/** создать аккаунт под внешний вход + привязать провайдера */
async function createLinked(
  profile: OAuthProfile,
  email: string,
): Promise<number> {
  const store = useStore();
  const existing = await store.findByEmail(email);
  if (existing) {
    await useIdentities().link(existing.id, profile.provider, profile.uid, email);
    return existing.id;
  }
  const nick = await uniqueNick(profile.name || profile.provider + profile.uid);
  const user = await store.create({ nick, email }); // без пароля
  await useIdentities().link(user.id, profile.provider, profile.uid, email);
  return user.id;
}

export async function resolveIdentity(
  profile: OAuthProfile,
  currentUserId: number | null,
): Promise<ResolveResult> {
  const ids = useIdentities();

  const linkedTo = await ids.userIdByProvider(profile.provider, profile.uid);

  // 1. привязка уже существует
  if (linkedTo) {
    if (currentUserId && currentUserId !== linkedTo) return { status: "conflict" };
    if (profile.email)
      await ids.link(linkedTo, profile.provider, profile.uid, profile.email);
    return { status: "ok", userId: linkedTo };
  }

  // 2. привязка к текущему вошедшему аккаунту
  if (currentUserId) {
    await ids.link(currentUserId, profile.provider, profile.uid, profile.email);
    return { status: "ok", userId: currentUserId };
  }

  // 3/4. есть email → слияние по совпадению либо новый аккаунт
  if (profile.email && validEmail(profile.email)) {
    const before = await useStore().findByEmail(profile.email);
    const userId = await createLinked(profile, profile.email.toLowerCase());
    return { status: "ok", userId, merged: Boolean(before), created: !before };
  }

  // 5. email нет — просим отдельно
  return { status: "needEmail" };
}

/** завершение Telegram-входа: пользователь ввёл email */
export async function completeWithEmail(
  profile: OAuthProfile,
  email: string,
): Promise<ResolveResult> {
  const clean = email.trim().toLowerCase();
  if (!validEmail(clean)) return { status: "conflict" };
  // если такой провайдер уже привязан — просто входим
  const linkedTo = await useIdentities().userIdByProvider(
    profile.provider,
    profile.uid,
  );
  if (linkedTo) return { status: "ok", userId: linkedTo };

  const before = await useStore().findByEmail(clean);
  const userId = await createLinked(profile, clean);
  return { status: "ok", userId, merged: Boolean(before), created: !before };
}
