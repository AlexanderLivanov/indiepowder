import { RELEASE_VERSION } from "~/utils/whatsnew";

/**
 * Управление окном «что нового».
 *
 * Показываем автоматически один раз на версию: в cookie лежит номер
 * последней увиденной версии. Меньше текущей RELEASE_VERSION — покажем
 * и запишем новую. Кнопкой в хедере можно открыть в любой момент.
 *
 * Cookie, а не localStorage — чтобы работало и при SSR (сервер тоже
 * видит, показывать ли), и не мигало окно на первой отрисовке.
 */
export function useWhatsNew() {
  const open = useState("whatsnew:open", () => false);

  // useCookie сам сериализует число и доступен на сервере и клиенте
  const seen = useCookie<number>("dustore_news", {
    default: () => 0,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  /** вызвать при старте — покажет окно, если версия новее виденной */
  function maybeShow() {
    if (import.meta.server) return;
    if (seen.value < RELEASE_VERSION) {
      // маленькая задержка, чтобы не драться с загрузкой страницы
      setTimeout(() => {
        open.value = true;
      }, 600);
    }
  }

  /** открыть вручную (кнопка в хедере) */
  function show() {
    open.value = true;
  }

  function close() {
    open.value = false;
    seen.value = RELEASE_VERSION; // запомнили, что видели
  }

  /** есть ли непрочитанное обновление — для точки на кнопке */
  const hasUnseen = computed(() => seen.value < RELEASE_VERSION);

  return { open, maybeShow, show, close, hasUnseen };
}
