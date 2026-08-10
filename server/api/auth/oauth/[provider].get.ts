import { randomUUID } from "node:crypto";
import { authorizeUrl, makePkce, providerConfigured } from "../../../utils/oauth";

/** Старт OAuth: ставим state в cookie и уводим на провайдера (Яндекс/VK). */
export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, "provider");
  if (provider !== "yandex" && provider !== "vk")
    throw createError({ statusCode: 404, statusMessage: "UNKNOWN_PROVIDER" });
  if (!providerConfigured(provider))
    throw createError({ statusCode: 503, statusMessage: "PROVIDER_OFF" });

  // origin для redirect_uri: приоритет — NUXT_OAUTH_ORIGIN (для прода за прокси)
  const origin =
    useRuntimeConfig(event).oauthOrigin || getRequestURL(event).origin;
  const link = getQuery(event).link === "1";
  const state = randomUUID();

  // VK ID требует PKCE: verifier кладём в cookie, challenge — в ссылку
  let challenge: string | undefined;
  const payload: Record<string, unknown> = { state, link, provider };
  if (provider === "vk") {
    const pkce = makePkce();
    challenge = pkce.challenge;
    payload.cv = pkce.verifier;
  }

  setCookie(event, "dustore_oauth", JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  await sendRedirect(event, authorizeUrl(provider, origin, state, challenge));
});
