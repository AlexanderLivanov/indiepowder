import { verifyTelegram, signPending, type TelegramData } from "../../../utils/oauth";
import { resolveIdentity } from "../../../utils/authResolve";
import { getUserId, setUserSession } from "../../../utils/session";
import { useStore } from "../../../utils/store";

/**
 * Возврат Telegram Login Widget (redirect-режим, GET с полями и hash).
 * Проверяем подпись; если это новый пользователь без email — уводим на шаг ввода почты.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event) as unknown as TelegramData;

  const profile = verifyTelegram(q);
  if (!profile) return sendRedirect(event, "/login?error=tg");

  const currentUserId = await getUserId(event);
  const res = await resolveIdentity(profile, currentUserId);

  if (res.status === "conflict")
    return sendRedirect(event, "/login?error=conflict");

  // новый пользователь без email — просим почту (профиль в подписанном токене)
  if (res.status === "needEmail") {
    const token = signPending(profile);
    return sendRedirect(event, "/login?tg=" + encodeURIComponent(token));
  }

  await setUserSession(event, res.userId);
  await useStore().touchActivity(res.userId);
  const flag = res.merged ? "?linked=1" : res.created ? "?welcome=1" : "";
  return sendRedirect(event, "/" + flag);
});
