import { getUserId } from "../../utils/session";
import { useStudios } from "../../db/studios";
import { useConsole } from "../../db/console";

/** Проекты текущей студии разработчика (только для вошедших). */
export default defineEventHandler(async (event) => {
  const uid = await getUserId(event);
  if (!uid) throw createError({ statusCode: 401, statusMessage: "NOT_AUTHED" });

  const studios = await useStudios().byOwner(uid);
  const current = studios[0] || null;
  const projects = current ? await useConsole().projects(current.id, 100) : [];

  return { projects, studio: current };
});
