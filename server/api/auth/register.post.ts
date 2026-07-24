import { validEmail, validNick } from "../../utils/password";
import { publicUser, useStore } from "../../utils/store";
import { setUserSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    nick?: string;
    email?: string;
    password?: string;
  }>(event);
  const nick = (body?.nick || "").trim();
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";

  if (!validNick(nick))
    throw createError({ statusCode: 400, statusMessage: "BAD_NICK" });
  if (!validEmail(email))
    throw createError({ statusCode: 400, statusMessage: "BAD_EMAIL" });
  if (password.length < 8)
    throw createError({ statusCode: 400, statusMessage: "WEAK_PASSWORD" });

  const store = useStore();
  if (await store.findByEmail(email))
    throw createError({ statusCode: 409, statusMessage: "EMAIL_TAKEN" });
  if (await store.findByNick(nick))
    throw createError({ statusCode: 409, statusMessage: "NICK_TAKEN" });

  const user = await store.create({ nick, email, password });
  await setUserSession(event, user.id);

  return { user: publicUser(user) };
});
