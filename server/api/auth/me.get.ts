import { publicUser, useStore } from "../../utils/store";
import { getUserId } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const id = await getUserId(event);
  if (!id) return { user: null };

  const user = await useStore().findById(id);
  return { user: user ? publicUser(user) : null };
});
