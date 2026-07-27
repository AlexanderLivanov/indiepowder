/** При первом заходе на новую версию — показываем окно «что нового». */
export default defineNuxtPlugin(() => {
  const { maybeShow } = useWhatsNew();
  // после того как приложение смонтировалось
  if (import.meta.client) {
    setTimeout(maybeShow, 100);
  }
});
