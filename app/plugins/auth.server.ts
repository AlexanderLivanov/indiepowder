/** При отрисовке на сервере сразу узнаём, кто вошёл — чтобы не мигало «гость». */
export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth();
  await fetchUser();
});
