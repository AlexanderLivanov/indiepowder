import { validEmail } from "../../utils/password";
import { publicUser, useStore } from "../../utils/store";
import { setUserSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event);
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";

  if (!validEmail(email) || !password) {
    throw createError({ statusCode: 400, statusMessage: "BAD_INPUT" });
  }

  const store = useStore();

  // 1. ищем в новой таблице
  let user = await store.findByEmail(email);

  // 2. TODO: если не нашли — ищем в старой `users` и переносим лениво:
  //    const legacy = await findLegacyByEmail(email)
  //    if (legacy && await verifyPassword(password, legacy.password)) {
  //      user = await store.create({ nick: legacy.login, email, password, legacyId: legacy.id })
  //    }

  if (!user)
    throw createError({ statusCode: 401, statusMessage: "NO_SUCH_USER" });

  const ok = await store.checkPassword(user as any, password);
  if (!ok)
    throw createError({ statusCode: 401, statusMessage: "BAD_PASSWORD" });

  await setUserSession(event, user.id);
  return { user: publicUser(user) };
});
