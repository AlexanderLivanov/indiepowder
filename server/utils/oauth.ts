import crypto from "node:crypto";
import type { ProviderId } from "./identities";

/**
 * OAuth-провайдеры входа: Яндекс, VK, Telegram.
 * Каждый возвращает нормализованный профиль {uid, email, name, avatar}.
 * Секреты — из runtimeConfig (env NUXT_*). Если не заданы — провайдер «не настроен».
 */

export interface OAuthProfile {
  provider: ProviderId;
  uid: string;
  email: string | null;
  name: string;
  avatar: string | null;
}

function cfg() {
  return useRuntimeConfig();
}

/** настроен ли провайдер (есть ли ключи) — чтобы скрывать/выключать кнопку */
export function providerConfigured(p: ProviderId): boolean {
  const c: any = cfg();
  if (p === "yandex") return Boolean(c.yandex?.clientId && c.yandex?.clientSecret);
  if (p === "vk") return Boolean(c.vk?.clientId && c.vk?.clientSecret);
  if (p === "telegram") return Boolean(c.telegram?.botToken);
  return false;
}

export function redirectUri(origin: string, provider: ProviderId): string {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

/* ─────────── redirect-провайдеры (Яндекс, VK) ─────────── */

/** PKCE (нужен VK ID) */
export function makePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(
  provider: "yandex" | "vk",
  origin: string,
  state: string,
  challenge?: string,
): string {
  const c: any = cfg();
  const ruri = encodeURIComponent(redirectUri(origin, provider));
  if (provider === "yandex") {
    const id = c.yandex.clientId;
    return (
      `https://oauth.yandex.ru/authorize?response_type=code` +
      `&client_id=${id}&redirect_uri=${ruri}` +
      `&scope=${encodeURIComponent("login:email login:info")}&state=${state}`
    );
  }
  // VK ID (OAuth 2.1 + PKCE) — актуальный вход VK (id.vk.com),
  // а НЕ устаревший oauth.vk.com (для новых приложений он не работает).
  const id = c.vk.clientId;
  return (
    `https://id.vk.com/authorize?response_type=code&client_id=${id}` +
    `&redirect_uri=${ruri}&scope=email&state=${state}` +
    `&code_challenge=${challenge}&code_challenge_method=S256`
  );
}

export interface ExchangeOpts {
  codeVerifier?: string;
  deviceId?: string;
  state?: string;
}

export async function exchangeCode(
  provider: "yandex" | "vk",
  origin: string,
  code: string,
  opts: ExchangeOpts = {},
): Promise<OAuthProfile> {
  const c: any = cfg();
  const ruri = redirectUri(origin, provider);

  if (provider === "yandex") {
    const tok: any = await $fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: c.yandex.clientId,
        client_secret: c.yandex.clientSecret,
      }).toString(),
    });
    const info: any = await $fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tok.access_token}` },
    });
    return {
      provider: "yandex",
      uid: String(info.id),
      email: info.default_email || (info.emails && info.emails[0]) || null,
      name: info.real_name || info.display_name || info.login || "Пользователь",
      avatar: info.is_avatar_empty
        ? null
        : info.default_avatar_id
          ? `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`
          : null,
    };
  }

  // VK ID: обмен кода на токен (PKCE) + профиль через user_info
  const tokenBody: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    code_verifier: opts.codeVerifier || "",
    client_id: String(c.vk.clientId),
    device_id: opts.deviceId || "",
    redirect_uri: ruri,
  };
  if (opts.state) tokenBody.state = opts.state;
  if (c.vk.clientSecret) tokenBody.client_secret = c.vk.clientSecret;

  const tok: any = await $fetch("https://id.vk.com/oauth2/auth", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(tokenBody).toString(),
  });

  const info: any = await $fetch("https://id.vk.com/oauth2/user_info", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: String(c.vk.clientId),
      access_token: tok.access_token,
    }).toString(),
  });
  const u = info.user || {};
  return {
    provider: "vk",
    uid: String(u.user_id ?? tok.user_id ?? ""),
    email: u.email || tok.email || null,
    name:
      [u.first_name, u.last_name].filter(Boolean).join(" ") || "Пользователь",
    avatar: u.avatar || null,
  };
}

/* ─────────── Telegram Login Widget ─────────── */

export interface TelegramData {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string | number;
  hash: string;
}

/**
 * Проверка подписи Telegram-виджета.
 * secret = SHA256(bot_token); проверяем HMAC-SHA256 от data_check_string.
 * Данные не старше суток.
 */
export function verifyTelegram(data: TelegramData): OAuthProfile | null {
  const c: any = cfg();
  const token = c.telegram?.botToken;
  if (!token || !data?.hash) return null;

  const { hash, ...rest } = data;
  const checkString = Object.keys(rest)
    .filter((k) => (rest as any)[k] !== undefined && (rest as any)[k] !== "")
    .sort()
    .map((k) => `${k}=${(rest as any)[k]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(token).digest();
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");
  if (hmac !== hash) return null;

  const age = Date.now() / 1000 - Number(data.auth_date);
  if (age > 86400) return null; // подпись протухла

  return {
    provider: "telegram",
    uid: String(data.id),
    email: null, // Telegram email не отдаёт — попросим отдельно
    name:
      [data.first_name, data.last_name].filter(Boolean).join(" ") ||
      data.username ||
      "Пользователь",
    avatar: data.photo_url || null,
  };
}

/* ─────────── подпись короткоживущего pending-токена ─────────── */
// нужен, когда через Telegram входит НОВЫЙ пользователь: аккаунт создаём
// только после ввода email — а до этого профиль храним в подписанном токене.

function secretKey(): string {
  const c: any = cfg();
  return c.sessionSecret || "dev-only-secret-change-me-32-chars-min";
}

export function signPending(profile: OAuthProfile, ttlMs = 15 * 60 * 1000): string {
  const payload = { p: profile, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secretKey())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPending(token: string): OAuthProfile | null {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expect = crypto
    .createHmac("sha256", secretKey())
    .update(body)
    .digest("base64url");
  if (
    sig.length !== expect.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))
  )
    return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    return payload.p as OAuthProfile;
  } catch {
    return null;
  }
}
