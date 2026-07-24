/**
 * Подтягивает текущего пользователя при старте приложения.
 *
 * ⚠️ Файл называется auth.ts, а НЕ auth.server.ts — специально.
 * Плагин должен отработать и на сервере (чтобы в отрисованном HTML
 * сразу был правильный пользователь), и на клиенте.
 */
export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth();
  await fetchUser();
});
