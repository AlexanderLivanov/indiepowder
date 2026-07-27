/**
 * Обновления, которые показываются пользователю всплывающим окном.
 *
 * Как добавить новое обновление:
 *   1. подними RELEASE_VERSION на +1
 *   2. добавь слайды в начало массива (свежее — сверху)
 *   3. картинки клади в public/whatsnew/
 *
 * Логика показа завязана на RELEASE_VERSION: пользователь увидит окно,
 * если сохранённая в cookie версия меньше текущей. Поднял версию —
 * окно снова показывается всем один раз.
 */

export const RELEASE_VERSION = 3;

export interface NewsSlide {
  id: string;
  image: string;
  title: string; // ключ i18n или готовый текст
  text: string;
  accent?: string; // необязательный цвет подложки под картинку
}

export const NEWS_SLIDES: NewsSlide[] = [
  {
    id: "islands",
    image: "/whatsnew/dusty.png",
    title: "news.islands.t",
    text: "news.islands.d",
    accent: "#2a0b33",
  },
  {
    id: "devs",
    image: "/whatsnew/dusty.png",
    title: "news.devs.t",
    text: "news.devs.d",
    accent: "#1d2b0a",
  },
  {
    id: "profile",
    image: "/whatsnew/dusty.png",
    title: "news.profile.t",
    text: "news.profile.d",
    accent: "#0a1f2b",
  },
];
