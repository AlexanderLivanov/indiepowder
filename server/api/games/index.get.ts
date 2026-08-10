import { useGamesStore } from "../../db/games";

/** Список реальных игр из БД (пусто, если базы нет — фронт покажет демо). */
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const limit = Math.min(200, Math.max(1, Number(q.limit) || 60));
  const games = await useGamesStore().list(limit);
  return { games };
});
