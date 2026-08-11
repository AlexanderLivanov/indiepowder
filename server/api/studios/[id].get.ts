import { useStudios } from "../../db/studios";
import { useGamesStore } from "../../db/games";

/** Публичный профиль студии + её опубликованные игры (/studio/:id). */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: "BAD_ID" });

  const studio = await useStudios().byId(id);
  if (!studio) throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });

  const games = await useGamesStore().byDeveloper(id, true);
  return { studio, games };
});
