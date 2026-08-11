import { useGameExtras } from "../../../db/gameExtras";

/** Доп-файлы и версии игры (для страницы игры). */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id)) return { files: [], versions: [] };

  const x = useGameExtras();
  const [files, versions] = await Promise.all([x.files(id), x.versions(id)]);
  return { files, versions };
});
