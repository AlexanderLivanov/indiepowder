import { getUserId } from "../../utils/session";
import { useIdentities } from "../../utils/identities";
import { useStore } from "../../utils/store";

/** Список привязанных способов входа + есть ли пароль (для страницы настроек). */
export default defineEventHandler(async (event) => {
  const id = await getUserId(event);
  if (!id) return { identities: [], hasPassword: false };

  const list = await useIdentities().listForUser(id);
  const user = await useStore().findById(id);

  return {
    hasPassword: Boolean(user?.passwordHash),
    identities: list.map((i) => ({
      provider: i.provider,
      email: i.email,
      createdAt: i.createdAt,
    })),
  };
});
