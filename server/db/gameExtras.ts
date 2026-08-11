import { asc, desc, eq } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { gameFiles, gameVersions } from "./schema";
import { withDbSafe } from "../utils/dbFallback";

/**
 * Доп-файлы (саундтрек/артбук/README) и версии сборок игры.
 * Читаются по числовому game_id. Если таблиц ещё нет / БД недоступна —
 * отдаём пусто (страница просто не показывает блоки).
 */

export interface GameFile {
  id: string;
  kind: string;
  title: string;
  url: string;
  size: number | null;
}
export interface GameVersion {
  id: string;
  version: string;
  channel: string;
  url: string;
  size: number | null;
  notes: string | null;
  current: boolean;
}

export const useGameExtras = () => ({
  async files(gameId: number): Promise<GameFile[]> {
    if (!hasDb() || !Number.isFinite(gameId)) return [];
    return withDbSafe(
      async () => {
        const rows = await useDb()
          .select()
          .from(gameFiles)
          .where(eq(gameFiles.gameId, gameId))
          .orderBy(asc(gameFiles.sort), asc(gameFiles.id));
        return rows.map((r) => ({
          id: String(r.id),
          kind: r.kind,
          title: r.title,
          url: r.url,
          size: r.size ?? null,
        }));
      },
      () => [],
      "gameFiles",
    );
  },

  async versions(gameId: number): Promise<GameVersion[]> {
    if (!hasDb() || !Number.isFinite(gameId)) return [];
    return withDbSafe(
      async () => {
        const rows = await useDb()
          .select()
          .from(gameVersions)
          .where(eq(gameVersions.gameId, gameId))
          .orderBy(desc(gameVersions.isCurrent), desc(gameVersions.createdAt));
        return rows.map((r) => ({
          id: String(r.id),
          version: r.version,
          channel: r.channel,
          url: r.url,
          size: r.size ?? null,
          notes: r.notes ?? null,
          current: Boolean(r.isCurrent),
        }));
      },
      () => [],
      "gameVersions",
    );
  },
});
