import { getUserId } from "../../utils/session";
import { useStudios } from "../../db/studios";

/** Контекст консоли: текущая студия (первая во владении) + список для переключателя. */
export default defineEventHandler(async (event) => {
  const uid = await getUserId(event);
  if (!uid) return { studio: null, studios: [] };

  const studios = await useStudios().byOwner(uid);
  return { studio: studios[0] || null, studios };
});
