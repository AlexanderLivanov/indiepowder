import { useGamesStore } from "../../db/games";

/** Одна игра из БД. 404, если нет в базе (фронт может откатиться на демо). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "NO_ID" });

  const game = await useGamesStore().get(id);
  if (!game) throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });

  return { game };
});
