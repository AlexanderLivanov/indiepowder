import { eq } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { staff, studios, users } from "./schema";
import { withDbSafe } from "../utils/dbFallback";

/** Участники студии: владелец + сотрудники (staff.org_id = studioId). */

export interface Member {
  uid: number;
  name: string;
  username: string;
  avatar: string | null;
  role: string;
  owner: boolean;
  working?: string | null; // над чем работает (проставляется в API)
}

const ROLE: Record<string, string> = {
  admin: "Админ", owner: "Владелец", dev: "Разработчик", developer: "Разработчик",
  artist: "Художник", designer: "Дизайнер", pm: "Менеджер", qa: "Тестировщик",
  sound: "Звук", writer: "Сценарист", marketer: "Маркетинг",
};

function roleLabel(r: string | null): string {
  if (!r) return "Сотрудник";
  return ROLE[r.trim().toLowerCase()] || r;
}
function fullName(r: { username: string | null; first: string | null; last: string | null }): string {
  const fio = [r.first, r.last].filter(Boolean).join(" ").trim();
  return fio || r.username || "Участник";
}
function httpAvatar(v: string | null): string | null {
  return v && /^https?:\/\//i.test(v) ? v : null;
}

export const useStaff = () => ({
  async byStudio(studioId: number): Promise<Member[]> {
    if (!hasDb() || !Number.isFinite(studioId)) return [];
    return withDbSafe(
      async () => {
        const members = new Map<number, Member>();

        // владелец студии — первым
        const st = await useDb()
          .select({ ownerId: studios.ownerId })
          .from(studios)
          .where(eq(studios.id, studioId))
          .limit(1);
        const ownerId = st[0]?.ownerId ?? null;
        if (ownerId) {
          const o = await useDb()
            .select({ username: users.username, first: users.firstName, last: users.lastName, pic: users.profilePicture })
            .from(users)
            .where(eq(users.id, ownerId))
            .limit(1);
          if (o[0]) {
            members.set(ownerId, {
              uid: ownerId, username: o[0].username || "", name: fullName(o[0]),
              avatar: httpAvatar(o[0].pic), role: "Владелец", owner: true,
            });
          }
        }

        // сотрудники
        const rows = await useDb()
          .select({
            uid: staff.uid, role: staff.role,
            username: users.username, first: users.firstName, last: users.lastName, pic: users.profilePicture,
          })
          .from(staff)
          .leftJoin(users, eq(staff.uid, users.id))
          .where(eq(staff.orgId, studioId));

        for (const r of rows) {
          if (!r.uid || members.has(r.uid)) continue;
          members.set(r.uid, {
            uid: r.uid, username: r.username || "", name: fullName(r),
            avatar: httpAvatar(r.pic), role: roleLabel(r.role), owner: false,
          });
        }

        return [...members.values()];
      },
      () => [],
      "staffByStudio",
    );
  },
});
