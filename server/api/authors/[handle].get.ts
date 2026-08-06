import { authorByHandle, postsByHandle } from "../../db/authors";

/** Профиль автора по handle + его посты (страница /u/:handle). */
export default defineEventHandler(async (event) => {
  const handle = getRouterParam(event, "handle");
  if (!handle) throw createError({ statusCode: 400, statusMessage: "NO_HANDLE" });

  const author = await authorByHandle(handle);
  if (!author) throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });

  const posts = await postsByHandle(handle);
  return { author, posts };
});
