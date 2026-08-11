import { resolveStudio } from "../../utils/studioContext";
import { useConsole } from "../../db/console";

/** Проекты выбранной студии разработчика (только для вошедших). */
export default defineEventHandler(async (event) => {
  const { studio } = await resolveStudio(event);
  if (!studio) throw createError({ statusCode: 401, statusMessage: "NO_STUDIO" });

  const projects = await useConsole().projects(studio.id, 100);
  return { projects, studio };
});
