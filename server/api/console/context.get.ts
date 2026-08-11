import { resolveStudio } from "../../utils/studioContext";

/** Контекст консоли: текущая студия + список для переключателя + выбрана ли явно. */
export default defineEventHandler(async (event) => {
  return await resolveStudio(event);
});
