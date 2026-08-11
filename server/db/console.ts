import { desc, eq } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { games } from "./schema";
import { withDbSafe } from "../utils/dbFallback";

/**
 * Данные консоли разработчика. Пока — все игры (любого статуса) как «проекты».
 * TODO: когда подключим таблицу studios/членство — фильтровать по текущей студии
 * (games.developer = studio_id), как в старой PHP-консоли.
 */

export interface Project {
  id: string;
  name: string;
  genre: string;
  status: string; // draft | published | closed
  cover: string | null;
  rating: number; // 0..5 из GQI
  ratingCount: number;
}

export const useConsole = () => ({
  /** проекты студии (все статусы, включая черновики) */
  async projects(studioId: number, limit = 100): Promise<Project[]> {
    if (!hasDb() || !Number.isFinite(studioId)) return [];
    return withDbSafe(
      async () => {
        const rows = await useDb()
          .select({
            id: games.id,
            name: games.name,
            genre: games.genre,
            status: games.status,
            cover: games.pathToCover,
            gqi: games.gqi,
            ratingCount: games.ratingCount,
          })
          .from(games)
          .where(eq(games.developer, studioId))
          .orderBy(desc(games.createdAt))
          .limit(limit);
        return rows.map((r) => ({
          id: String(r.id),
          name: r.name || "Без названия",
          genre: r.genre || "",
          status: r.status,
          cover: r.cover || null,
          rating: r.gqi != null ? Math.round((r.gqi / 20) * 10) / 10 : 0,
          ratingCount: r.ratingCount ?? 0,
        }));
      },
      () => [],
      "consoleProjects",
    );
  },
});
