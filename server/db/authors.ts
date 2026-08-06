import { useFeedStore, SEED, type FeedPost } from "./feed";

/**
 * Профили авторов (порт StayInspired/data/authors.js).
 * Ключ — handle без «@». Пока статические демо-данные;
 * позже связываются с таблицей users. Посты автора берём из ленты
 * (DB или сид) по совпадению handle.
 */

export interface Author {
  name: string;
  handle: string;
  kind: "author" | "studio";
  bio: string;
  followers: string;
  following: string;
  initials: string;
}

type AuthorSeed = Omit<Author, "initials">;

const AUTHORS: Record<string, AuthorSeed> = {
  alexander: { name: "Александр", handle: "alexander", kind: "author", bio: "Строю платформы для разработчиков. Думаю вслух о дизайне, продукте и вдохновении.", followers: "2.4к", following: "318" },
  miradraws: { name: "Мира Оконкво", handle: "miradraws", kind: "author", bio: "Иллюстратор и автор коротких заметок о смелости начинать.", followers: "2.4к", following: "180" },
  dvey: { name: "Даниэль Вей", handle: "dvey", kind: "author", bio: "Пишу об утренних ритуалах, старых блокнотах и внимании.", followers: "860", following: "210" },
  solmaking: { name: "Sol", handle: "solmaking", kind: "studio", bio: "Маленькая студия про процесс, видео и эксперименты.", followers: "5.1к", following: "92" },
  "naya.writes": { name: "Ная", handle: "naya.writes", kind: "author", bio: "Эссе о письме, черновиках и тихой архитектуре внимания.", followers: "3.3к", following: "145" },
  tmr: { name: "Тимур", handle: "tmr", kind: "author", bio: "Афоризмы и уродливые первые версии.", followers: "1.2к", following: "77" },
  iris: { name: "Ирис Кан", handle: "iris", kind: "author", bio: "Задаю маленькие вопросы, которые вдохновляют.", followers: "940", following: "300" },
  luka: { name: "Лука Мор", handle: "luka", kind: "author", bio: "Замечаю мелочи. Иногда пишу о них.", followers: "410", following: "260" },
  evarain: { name: "Эва Рейн", handle: "evarain", kind: "author", bio: "Дизайнер. Про поля, паузы и тишину в интерфейсах.", followers: "1.8к", following: "130" },
  romav: { name: "Рома Верт", handle: "romav", kind: "author", bio: "Спорю по делу, соглашаюсь по сути.", followers: "520", following: "190" },
  sonya: { name: "Соня", handle: "sonya", kind: "author", bio: "Сохраняю хорошее, показываю команде.", followers: "330", following: "410" },
  kimsolo: { name: "Ким Соло", handle: "kimsolo", kind: "author", bio: "О внимании как об исчерпаемом ресурсе.", followers: "4.9к", following: "60" },
};

export function initials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const clean = (h: string) => String(h || "").replace(/^@/, "");

/** профиль по handle: из карты, иначе собрать заглушку из постов ленты */
export async function authorByHandle(handle: string): Promise<Author | null> {
  const key = clean(handle);
  if (AUTHORS[key]) return { ...AUTHORS[key], initials: initials(AUTHORS[key].name) };

  const posts = await useFeedStore().list(200);
  const fromPost =
    posts.find((p) => clean(p.handle) === key) ??
    SEED.find((p) => clean(p.handle) === key);
  if (fromPost) {
    return {
      name: fromPost.author,
      handle: key,
      kind: "author",
      bio: "",
      followers: "—",
      following: "—",
      initials: initials(fromPost.author),
    };
  }
  return null;
}

/** посты автора по handle */
export async function postsByHandle(handle: string): Promise<FeedPost[]> {
  const key = clean(handle);
  const posts = await useFeedStore().list(200);
  const src = posts.length ? posts : SEED;
  return src.filter((p) => clean(p.handle) === key);
}
