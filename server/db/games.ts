import { and, desc, eq, sql } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { games, studios, type GameRow } from "./schema";

/**
 * Чтение реальных игр из таблицы `games` (база dustore).
 * Наружу отдаём нормализованную форму DbGame, удобную витрине.
 * Если базы нет/недоступна — отдаём пусто (фронт откатывается на демо-данные).
 */

export interface DbGame {
  id: string;
  name: string;
  genre: string;
  developerId: number | null;
  developerName: string | null;
  developerTiker: string | null;
  shortDescription: string;
  description: string;
  platforms: string[];
  releaseDate: string | null;
  cover: string | null;
  icon: string | null;
  banner: string | null;
  trailer: string | null;
  website: string | null;
  screenshots: string[];
  gqi: number | null;
  rating: number; // 0..5, из GQI
  ratingCount: number;
  downloads: number; // сколько раз игра в чьей-то библиотеке (таблица library)
  price: number;
  inSubscription: boolean;
  languages: string[];
  ageRating: string;
  features: string[];
  requirements: string;
}

/** «а, б, в» / перенос строки → массив строк (для platforms, languages) */
function parseList(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** screenshots в БД: [{"id":"..","path":"https://.."}] либо массив URL-строк */
function toUrlList(v: string | null): string[] {
  if (!v) return [];
  const s = v.trim();
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr))
        return arr
          .map((it: any) =>
            typeof it === "string" ? it : it?.path || it?.url || it?.src || "",
          )
          .filter(Boolean);
    } catch {
      /* не JSON */
    }
  }
  return parseList(s);
}

/** features/requirements в БД: [{"icon","title","description"}] / [{"label",..}] */
function toTitleList(v: string | null): string[] {
  if (!v) return [];
  const s = v.trim();
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr))
        return arr
          .map((it: any) => {
            if (typeof it === "string") return it;
            const t = [it?.icon, it?.title].filter(Boolean).join(" ").trim();
            return t || it?.label || "";
          })
          .filter(Boolean);
    } catch {
      /* не JSON */
    }
  }
  return parseList(s);
}

function isoDate(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function map(
  r: GameRow,
  devName?: string | null,
  devTiker?: string | null,
  downloads = 0,
): DbGame {
  const gqi = r.gqi ?? null;
  return {
    id: String(r.id),
    name: r.name || "Без названия",
    genre: r.genre || "",
    developerId: r.developer ?? null,
    developerName: devName ?? null,
    developerTiker: devTiker ?? null,
    shortDescription: r.shortDescription || "",
    description: r.description || "",
    platforms: parseList(r.platforms),
    releaseDate: isoDate(r.releaseDate),
    cover: r.pathToCover || null,
    icon: r.iconUrl || null,
    banner: r.bannerUrl || null,
    trailer: r.trailerUrl || null,
    website: r.gameWebsite || null,
    screenshots: toUrlList(r.screenshots),
    gqi,
    rating: gqi != null ? round1(gqi / 20) : 0,
    ratingCount: r.ratingCount ?? 0,
    downloads,
    price: r.price ? Number(r.price) : 0,
    inSubscription: Boolean(r.inSubscription),
    languages: parseList(r.languages),
    ageRating: r.ageRating || "",
    features: toTitleList(r.features),
    requirements: toTitleList(r.requirements).join(", "),
  };
}

export const useGamesStore = () => ({
  /** опубликованные и не скрытые игры, свежие сверху */
  async list(limit = 60): Promise<DbGame[]> {
    if (!hasDb()) return [];
    try {
      const rows = await useDb()
        .select({
          g: games,
          sName: studios.name,
          sTiker: studios.tiker,
          lib: sql<number>`(select count(*) from library where library.game_id = ${games.id})`,
        })
        .from(games)
        .leftJoin(studios, eq(games.developer, studios.id))
        .where(eq(games.status, "published"))
        .orderBy(desc(games.createdAt))
        .limit(limit);
      return rows.map((r) => map(r.g, r.sName, r.sTiker, Number(r.lib) || 0));
    } catch (e) {
      // не роняем витрину 500-й: логируем и отдаём пусто (фронт покажет демо)
      console.error("[games.list] запрос упал:", e);
      return [];
    }
  },

  /** одна игра по id (для страницы игры) */
  async get(id: string | number): Promise<DbGame | null> {
    if (!hasDb()) return null;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return null;
    try {
      const rows = await useDb()
        .select({
          g: games,
          sName: studios.name,
          sTiker: studios.tiker,
          lib: sql<number>`(select count(*) from library where library.game_id = ${games.id})`,
        })
        .from(games)
        .leftJoin(studios, eq(games.developer, studios.id))
        .where(eq(games.id, numId))
        .limit(1);
      if (!rows[0]) return null;
      return map(rows[0].g, rows[0].sName, rows[0].sTiker, Number(rows[0].lib) || 0);
    } catch (e) {
      console.error("[games.get] запрос упал:", e);
      return null;
    }
  },

  /** игры конкретной студии (для страницы студии / консоли) */
  async byDeveloper(devId: number, publishedOnly = true): Promise<DbGame[]> {
    if (!hasDb() || !Number.isFinite(devId)) return [];
    try {
      const where = publishedOnly
        ? and(eq(games.developer, devId), eq(games.status, "published"))
        : eq(games.developer, devId);
      const rows = await useDb()
        .select({
          g: games,
          sName: studios.name,
          sTiker: studios.tiker,
          lib: sql<number>`(select count(*) from library where library.game_id = ${games.id})`,
        })
        .from(games)
        .leftJoin(studios, eq(games.developer, studios.id))
        .where(where)
        .orderBy(desc(games.createdAt))
        .limit(200);
      return rows.map((r) => map(r.g, r.sName, r.sTiker, Number(r.lib) || 0));
    } catch (e) {
      console.error("[games.byDeveloper] запрос упал:", e);
      return [];
    }
  },
});
