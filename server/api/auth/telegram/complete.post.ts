import { verifyPending } from "../../../utils/oauth";
import { completeWithEmail } from "../../../utils/authResolve";
import { setUserSession } from "../../../utils/session";
import { publicUser, useStore } from "../../../utils/store";

/** Завершение Telegram-входа: пользователь ввёл email → создаём/сливаем аккаунт. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; email?: string }>(event);
  const profile = verifyPending(body?.token || "");
  if (!profile) throw createError({ statusCode: 400, statusMessage: "BAD_TOKEN" });

  const res = await completeWithEmail(profile, body?.email || "");
  if (res.status !== "ok")
    throw createError({ statusCode: 400, statusMessage: "BAD_EMAIL" });

  await setUserSession(event, res.userId);
  const user = await useStore().findById(res.userId);
  if (!user) throw createError({ statusCode: 500, statusMessage: "NO_USER" });
  return { user: publicUser(user), merged: res.merged, created: res.created };
});
