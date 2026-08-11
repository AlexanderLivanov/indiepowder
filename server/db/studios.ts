import { eq, inArray } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { studios, type StudioRow } from "./schema";
import { withDbSafe } from "../utils/dbFallback";

/** Студии-разработчики (таблица studios). games.developer = studios.id. */

export interface Studio {
  id: number;
  name: string;
  tiker: string;
  ownerId: number | null;
  bio: string;
  avatar: string | null;
  banner: string | null;
  vk: string | null;
  tg: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  teamSize: string | null;
  specialization: string | null;
  foundationDate: string | null;
}

const SPEC: Record<string, string> = {
  software: "ПО", pc: "ПК", mobile: "Мобильные", vr: "VR",
  all: "Разные жанры", console: "Консоли", table: "Настольные",
};

function stripHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function isHttp(v: string | null): string | null {
  return v && /^https?:\/\//i.test(v) ? v : null;
}

function toStudio(r: StudioRow): Studio {
  return {
    id: r.id,
    name: r.name || "Студия",
    tiker: r.tiker || "",
    ownerId: r.ownerId ?? null,
    bio: stripHtml(r.description),
    avatar: isHttp(r.avatarLink),
    banner: isHttp(r.bannerLink),
    vk: r.vkLink || null,
    tg: r.tgLink || null,
    website: r.website || null,
    country: r.country || null,
    city: r.city || null,
    teamSize: r.teamSize || null,
    specialization: r.specialization ? SPEC[r.specialization] || r.specialization : null,
    foundationDate: r.foundationDate || null,
  };
}

export const useStudios = () => ({
  async byId(id: number): Promise<Studio | null> {
    if (!hasDb() || !Number.isFinite(id)) return null;
    return withDbSafe(
      async () => {
        const rows = await useDb().select().from(studios).where(eq(studios.id, id)).limit(1);
        return rows[0] ? toStudio(rows[0]) : null;
      },
      () => null,
      "studioById",
    );
  },

  /** студии, которыми владеет пользователь (для консоли) */
  async byOwner(userId: number): Promise<Studio[]> {
    if (!hasDb() || !Number.isFinite(userId)) return [];
    return withDbSafe(
      async () => {
        const rows = await useDb().select().from(studios).where(eq(studios.ownerId, userId));
        return rows.map(toStudio);
      },
      () => [],
      "studiosByOwner",
    );
  },

  /** карта id → {name, tiker} для проставления разработчика в списках игр */
  async namesByIds(ids: number[]): Promise<Map<number, { name: string; tiker: string }>> {
    const out = new Map<number, { name: string; tiker: string }>();
    const clean = [...new Set(ids.filter((n) => Number.isFinite(n)))];
    if (!hasDb() || !clean.length) return out;
    return withDbSafe(
      async () => {
        const rows = await useDb()
          .select({ id: studios.id, name: studios.name, tiker: studios.tiker })
          .from(studios)
          .where(inArray(studios.id, clean));
        for (const r of rows) out.set(r.id, { name: r.name || "Студия", tiker: r.tiker || "" });
        return out;
      },
      () => out,
      "studiosNamesByIds",
    );
  },
});
