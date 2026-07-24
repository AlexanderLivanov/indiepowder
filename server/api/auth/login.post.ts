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
  const user = await store.findByEmail(email);
  if (!user)
    throw createError({ statusCode: 401, statusMessage: "NO_SUCH_USER" });

  const ok = await store.checkPassword(user, password);
  if (!ok)
    throw createError({ statusCode: 401, statusMessage: "BAD_PASSWORD" });

  await setUserSession(event, user.id);
  await store.touchActivity(user.id);

  return { user: publicUser(user) };
});
