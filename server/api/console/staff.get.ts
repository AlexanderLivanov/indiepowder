import { resolveStudio } from "../../utils/studioContext";
import { useStaff } from "../../db/staff";
import { useGamesStore } from "../../db/games";

/** Участники выбранной студии + размер студии (для картинки офиса) и «над чем работает». */
export default defineEventHandler(async (event) => {
  const { studio } = await resolveStudio(event);
  if (!studio) return { members: [], size: null };

  const members = await useStaff().byStudio(studio.id);

  // «над чем работает» — раскидываем проекты студии по участникам (пока так)
  const games = await useGamesStore().byDeveloper(studio.id, false);
  members.forEach((m, i) => {
    m.working = games.length ? games[i % games.length]!.name : null;
  });

  return { members, size: studio.teamSize };
});
