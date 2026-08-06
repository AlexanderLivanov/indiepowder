import { useFeedStore } from "../../db/feed";

/** Лента вдохновения: список постов (свежие сверху). */
export default defineEventHandler(async () => {
  const posts = await useFeedStore().list(50);
  return { posts };
});
