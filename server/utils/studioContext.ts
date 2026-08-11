import type { H3Event } from "h3";
import { getUserId } from "./session";
import { useStudios, type Studio } from "../db/studios";

/**
 * Текущая студия консоли: студии владельца + выбранная (cookie dustore_studio).
 * selected=false, если пользователь ещё не выбирал студию явно — тогда UI
 * отправит его на экран выбора.
 */
export async function resolveStudio(event: H3Event): Promise<{
  studio: Studio | null;
  studios: Studio[];
  selected: boolean;
}> {
  const uid = await getUserId(event);
  if (!uid) return { studio: null, studios: [], selected: false };

  const studios = await useStudios().byOwner(uid);
  const cookieId = Number(getCookie(event, "dustore_studio"));
  const chosen = Number.isFinite(cookieId)
    ? studios.find((s) => s.id === cookieId)
    : undefined;

  return {
    studio: chosen || studios[0] || null,
    studios,
    selected: Boolean(chosen),
  };
}
