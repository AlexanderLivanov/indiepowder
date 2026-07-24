import { publicUser, useStore } from "../utils/store";
import { getUserId } from "../utils/session";

export default defineEventHandler(async (event) => {
  const id = await getUserId(event);
  if (!id)
    throw createError({ statusCode: 401, statusMessage: "NOT_AUTHORIZED" });

  const body = await readBody<Record<string, string>>(event);
  const clean = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : undefined;

  const updated = await useStore().updateProfile(id, {
    displayName: clean(body.displayName, 120),
    city: clean(body.city, 100),
    country: clean(body.country, 100),
    about: clean(body.about, 2000),
    website: clean(body.website, 300),
    vk: clean(body.vk, 300),
    l4tRole: clean(body.l4tRole, 200),
  });

  if (!updated)
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  return { user: publicUser(updated) };
});
