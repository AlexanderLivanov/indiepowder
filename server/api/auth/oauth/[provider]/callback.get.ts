import { exchangeCode } from "../../../../utils/oauth";
import { resolveIdentity } from "../../../../utils/authResolve";
import { getUserId, setUserSession } from "../../../../utils/session";
import { useStore } from "../../../../utils/store";

/** Возврат от Яндекс/VK: меняем код на профиль, сводим к аккаунту, входим. */
export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, "provider");
  if (provider !== "yandex" && provider !== "vk")
    throw createError({ statusCode: 404, statusMessage: "UNKNOWN_PROVIDER" });

  const q = getQuery(event);
  const code = q.code ? String(q.code) : "";
  const state = q.state ? String(q.state) : "";

  const raw = getCookie(event, "dustore_oauth");
  deleteCookie(event, "dustore_oauth", { path: "/" });

  let saved: { state?: string; cv?: string } = {};
  try {
    saved = raw ? JSON.parse(raw) : {};
  } catch {
    saved = {};
  }

  if (!code || !state || saved.state !== state)
    return sendRedirect(event, "/login?error=state");

  // origin ДОЛЖЕН совпадать с тем, что был на старте (redirect_uri в обмене кода)
  const origin =
    useRuntimeConfig(event).oauthOrigin || getRequestURL(event).origin;

  let profile;
  try {
    profile = await exchangeCode(provider, origin, code, {
      codeVerifier: saved.cv, // VK ID PKCE verifier из cookie
      deviceId: q.device_id ? String(q.device_id) : undefined, // VK ID
      state,
    });
  } catch {
    return sendRedirect(event, "/login?error=oauth");
  }

  const currentUserId = await getUserId(event); // если вошёл — привяжем к нему
  const res = await resolveIdentity(profile, currentUserId);

  if (res.status === "conflict")
    return sendRedirect(event, "/login?error=conflict");
  if (res.status === "needEmail")
    return sendRedirect(event, "/login?error=noemail");

  await setUserSession(event, res.userId);
  await useStore().touchActivity(res.userId);

  const flag = res.merged ? "?linked=1" : res.created ? "?welcome=1" : "";
  return sendRedirect(event, "/" + flag);
});
