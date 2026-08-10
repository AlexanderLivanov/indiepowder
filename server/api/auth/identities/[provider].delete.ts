import { getUserId } from "../../../utils/session";
import { useIdentities, type ProviderId } from "../../../utils/identities";
import { useStore } from "../../../utils/store";

const KNOWN: ProviderId[] = ["yandex", "vk", "telegram"];

/**
 * Отвязать способ входа. Защита: нельзя убрать последний способ войти —
 * если нет пароля и это единственная привязка, аккаунт стал бы недоступен.
 */
export default defineEventHandler(async (event) => {
  const id = await getUserId(event);
  if (!id) throw createError({ statusCode: 401, statusMessage: "NOT_AUTHED" });

  const provider = getRouterParam(event, "provider") as ProviderId;
  if (!KNOWN.includes(provider))
    throw createError({ statusCode: 404, statusMessage: "UNKNOWN_PROVIDER" });

  const ids = useIdentities();
  const list = await ids.listForUser(id);
  const user = await useStore().findById(id);
  const hasPassword = Boolean(user?.passwordHash);

  const isLinked = list.some((i) => i.provider === provider);
  if (!isLinked) return { ok: true };

  if (!hasPassword && list.length <= 1)
    throw createError({ statusCode: 400, statusMessage: "LAST_METHOD" });

  await ids.unlink(id, provider);
  return { ok: true };
});
