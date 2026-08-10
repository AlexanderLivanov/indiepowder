import { useStore } from "../../utils/store";

/** Публичный профиль пользователя платформы по нику (/u/:username). */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, "username");
  if (!username) throw createError({ statusCode: 400, statusMessage: "NO_NICK" });

  const row = await useStore().findByNick(username);
  if (!row) throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });

  // отдаём только публичные поля (без email/passwordHash)
  return {
    user: {
      id: row.id,
      nick: row.nick,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      city: row.city,
      country: row.country,
      about: row.about,
      website: row.website,
      vk: row.vk,
      telegram: row.telegram,
      role: row.role,
      verified: row.verified,
      l4tRole: row.l4tRole,
      votesUp: row.votesUp,
      votesDown: row.votesDown,
      profileViews: row.profileViews,
      registered: row.registered,
    },
  };
});
