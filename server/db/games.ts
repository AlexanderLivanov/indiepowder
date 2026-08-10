import { and, desc, eq } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { games, type GameRow } from "./schema";
import { isDbConnError } from "../utils/dbFallback";

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
  price: number;
  inSubscription: boolean;
  languages: string[];
  ageRating: string;
  features: string[];
  requirements: string;
}

/** «а, б, в» / перенос строки / JSON-массив → массив строк */
function parseList(v: string | null): string[] {
  if (!v) return [];
  const s = v.trim();
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map(String).map((x) => x.trim()).filter(Boolean);
    } catch {
      /* не JSON — падаем в split ниже */
    }
  }
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isoDate(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function map(r: GameRow): DbGame {
  const gqi = r.gqi ?? null;
  return {
    id: String(r.id),
    name: r.name || "Без названия",
    genre: r.genre || "",
    developerId: r.developer ?? null,
    shortDescription: r.shortDescription || "",
    description: r.description || "",
    platforms: parseList(r.platforms),
    releaseDate: isoDate(r.releaseDate),
    cover: r.pathToCover || null,
    icon: r.iconUrl || null,
    banner: r.bannerUrl || null,
    trailer: r.trailerUrl || null,
    website: r.gameWebsite || null,
    screenshots: parseList(r.screenshots),
    gqi,
    rating: gqi != null ? round1(gqi / 20) : 0,
    ratingCount: r.ratingCount ?? 0,
    price: r.price ? Number(r.price) : 0,
    inSubscription: Boolean(r.inSubscription),
    languages: parseList(r.languages),
    ageRating: r.ageRating || "",
    features: parseList(r.features),
    requirements: r.requirements || "",
  };
}

export const useGamesStore = () => ({
  /** опубликованные и не скрытые игры, свежие сверху */
  async list(limit = 60): Promise<DbGame[]> {
    if (!hasDb()) return [];
    try {
      const rows: GameRow[] = await useDb()
        .select()
        .from(games)
        .where(and(eq(games.status, "published"), eq(games.hidden, 0)))
        .orderBy(desc(games.createdAt))
        .limit(limit);
      return rows.map(map);
    } catch (e) {
      if (isDbConnError(e)) return [];
      throw e;
    }
  },

  /** одна игра по id (для страницы игры) */
  async get(id: string | number): Promise<DbGame | null> {
    if (!hasDb()) return null;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return null;
    try {
      const rows: GameRow[] = await useDb()
        .select()
        .from(games)
        .where(eq(games.id, numId))
        .limit(1);
      return rows[0] ? map(rows[0]) : null;
    } catch (e) {
      if (isDbConnError(e)) return null;
      throw e;
    }
  },
});
