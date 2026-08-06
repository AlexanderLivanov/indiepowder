import { useFeedStore } from "../../db/feed";

/** Одиночный пост + тред комментариев (страница /p/:id). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "NO_ID" });

  const res = await useFeedStore().get(id);
  if (!res) throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });

  return res; // { post, thread }
});
