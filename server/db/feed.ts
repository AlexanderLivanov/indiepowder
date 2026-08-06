import { desc } from "drizzle-orm";
import { hasDb, useDb } from "./client";
import { feedPosts, type FeedPostRow } from "./schema";

/**
 * Данные ленты вдохновения (раздел /feed, порт из StayInspired).
 *
 * Работает по тому же принципу, что и server/utils/store.ts:
 *   • есть DATABASE_URL → читаем/пишем в таблицу feed_posts
 *   • нет базы → запасной режим в памяти (демо-данные ниже)
 * Так страница живёт и в dev без базы, и на проде с базой.
 */

export type FeedKind = "spark" | "note" | "article" | "line" | "thread";

export interface FeedMedia {
  type: "image" | "video";
  label: string;
}

export interface FeedReply {
  author: string;
  handle: string;
  ago: string;
  body: string;
}

export interface FeedPost {
  id: string;
  kind: FeedKind;
  author: string;
  handle: string;
  ago: string;
  number?: number; // порядковый бейдж (#1) у первого spark
  title?: string;
  body?: string;
  excerpt?: string;
  content?: string[]; // абзацы полной статьи
  media?: FeedMedia;
  reply?: FeedReply; // встроенная ветка у thread
  up: number;
  replies: number;
}

/* ─────────── демо-данные (перенесены из StayInspired/data/posts.js) ─────────── */
export const SEED: FeedPost[] = [
  {
    id: "p1",
    kind: "spark",
    author: "Мира Оконкво",
    handle: "@miradraws",
    ago: "2 ч",
    number: 1,
    body: "Тебе не нужна идея получше. Нужно выпустить ту, которую ты бесконечно правишь в голове.",
    up: 96,
    replies: 14,
  },
  {
    id: "p2",
    kind: "note",
    author: "Даниэль Вей",
    handle: "@dvey",
    ago: "4 ч",
    body: "Утро, старые блокноты, прошлый я — оказался умнее.",
    media: { type: "image", label: "Изображение · 1200×675" },
    up: 41,
    replies: 6,
  },
  {
    id: "p3",
    kind: "note",
    author: "Sol",
    handle: "@solmaking",
    ago: "5 ч",
    body: "Записал процесс работы — оказывается, я всё делаю наоборот.",
    media: { type: "video", label: "Видео · 2:34" },
    up: 203,
    replies: 22,
  },
  {
    id: "p4",
    kind: "article",
    author: "Ная",
    handle: "@naya.writes",
    ago: "7 ч",
    title: "Почему черновик лучше идеального текста",
    excerpt:
      "Перфекционизм — это не стандарт качества. Это способ никогда не начать. Каждый раз, когда вы откладываете публикацию в ожидании «правильного момента», вы теряете возможность получить обратную связь, которая сделала бы текст действительно лучше…",
    content: [
      "Перфекционизм — это не стандарт качества. Это способ никогда не начать.",
      "Каждый раз, когда вы откладываете публикацию в ожидании «правильного момента», вы теряете возможность получить обратную связь, которая сделала бы текст действительно лучше.",
      "Черновик — это не незаконченный текст. Это первый разговор с читателем. Он может быть неловким, угловатым, недосказанным — и всё равно живым.",
      "Самое страшное, что может случиться с хорошей идеей — это то, что она останется только в вашей голове.",
    ],
    up: 58,
    replies: 12,
  },
  {
    id: "p5",
    kind: "line",
    author: "Тимур",
    handle: "@tmr",
    ago: "9 ч",
    body: "сначала сделай уродливую версию.",
    up: 312,
    replies: 44,
  },
  {
    id: "p6",
    kind: "thread",
    author: "Ирис Кан",
    handle: "@iris",
    ago: "12 ч",
    body: "Какая маленькая вещь вдохновила вас на этой неделе?",
    reply: {
      author: "Лука Мор",
      handle: "@luka",
      ago: "11 ч",
      body: "Сосед чинил велосипед во дворе и напевал. Просто потому что.",
    },
    up: 87,
    replies: 31,
  },
];

/* ─────────── демо-треды (комментарии), из StayInspired ─────────── */
export const SAMPLE_THREADS: Record<string, FeedReply[]> = {
  p1: [
    { author: "Лука Мор", handle: "@luka", ago: "1 ч", body: "Записал на стикер над столом. Спасибо." },
    { author: "Эва Рейн", handle: "@evarain", ago: "38 м", body: "Больно точно. Иду выпускать." },
  ],
  p4: [
    { author: "Рома Верт", handle: "@romav", ago: "3 ч", body: "Согласен по всем пунктам, кроме шапки — она мешает на длинных текстах." },
    { author: "Соня", handle: "@sonya", ago: "2 ч", body: "Сохранила. Буду показывать команде вместо ТЗ." },
  ],
  p5: [
    { author: "Ким Соло", handle: "@kimsolo", ago: "8 ч", body: "Единственный рабочий способ начать." },
  ],
  p6: [
    { author: "Лука Мор", handle: "@luka", ago: "11 ч", body: "Сосед чинил велосипед во дворе и напевал. Просто потому что." },
    { author: "Ная", handle: "@naya.writes", ago: "10 ч", body: "Запах кофе у соседней двери по утрам." },
  ],
};

export function threadFor(id: string): FeedReply[] {
  return SAMPLE_THREADS[id] ?? [];
}

/* ─────────── запасной режим без базы ─────────── */
const mem: FeedPost[] = [];
let memSeq = 0;

function seedMem() {
  if (mem.length) return;
  mem.push(...SEED.map((p) => ({ ...p })));
}

/* ─────────── строка БД → наш объект ─────────── */
function fromDb(r: FeedPostRow): FeedPost {
  return {
    id: String(r.id),
    kind: (r.kind as FeedKind) || "note",
    author: r.authorName,
    handle: r.authorHandle,
    ago: ago(r.createdAt),
    title: r.title ?? undefined,
    body: r.body ?? undefined,
    excerpt: r.kind === "article" ? (r.body ?? undefined) : undefined,
    content: r.content ? r.content.split(/\n\n+/).filter(Boolean) : undefined,
    media:
      r.mediaType && r.mediaLabel
        ? { type: r.mediaType as "image" | "video", label: r.mediaLabel }
        : undefined,
    up: r.up ?? 0,
    replies: r.replies ?? 0,
  };
}

/** грубое «сколько назад» для ленты */
function ago(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d) : d;
  const min = Math.max(0, Math.round((Date.now() - t.getTime()) / 60000));
  if (min < 1) return "только что";
  if (min < 60) return `${min} м`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.round(h / 24)} д`;
}

export interface NewFeedInput {
  kind: FeedKind;
  author: string;
  handle: string;
  authorId?: number | null;
  title?: string;
  body: string;
  content?: string;
}

/** запись в память — общий путь для «нет базы» и «база недоступна» */
function memCreate(input: NewFeedInput, excerpt?: string): FeedPost {
  seedMem();
  const post: FeedPost = {
    id: `m${++memSeq}`,
    kind: input.kind,
    author: input.author,
    handle: input.handle,
    ago: "только что",
    title: input.title,
    body: input.kind === "article" ? excerpt : input.body,
    excerpt,
    content: input.content
      ? input.content.split(/\n\n+/).filter(Boolean)
      : undefined,
    up: 0,
    replies: 0,
  };
  mem.unshift(post);
  return post;
}

/** connection refused / db down — чтобы не ронять раздел 500-й */
function isConnError(e: any): boolean {
  const code = e?.code || e?.cause?.code || e?.errors?.[0]?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ER_BAD_DB_ERROR" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    /ECONNREFUSED|ETIMEDOUT/.test(String(e?.message || ""))
  );
}

export const useFeedStore = () => ({
  /** пост по id + его тред (комментарии) — для страницы /p/:id */
  async get(id: string): Promise<{ post: FeedPost; thread: FeedReply[] } | null> {
    const all = await this.list(200);
    const post = all.find((p) => p.id === id) ?? SEED.find((p) => p.id === id);
    if (!post) return null;
    return { post, thread: threadFor(id) };
  },

  async list(limit = 50): Promise<FeedPost[]> {
    if (!hasDb()) {
      seedMem();
      return mem.slice(0, limit);
    }
    try {
      const rows = await useDb()
        .select()
        .from(feedPosts)
        .orderBy(desc(feedPosts.createdAt))
        .limit(limit);
      // если база пустая — отдаём сид, чтобы лента не выглядела мёртвой
      if (!rows.length) return SEED.slice(0, limit);
      return rows.map(fromDb);
    } catch (e) {
      // база прописана в .env, но недоступна (MySQL не запущен и т.п.) —
      // лента продолжает работать на демо-данных вместо падения 500
      if (isConnError(e)) {
        seedMem();
        return mem.slice(0, limit);
      }
      throw e;
    }
  },

  async create(input: NewFeedInput): Promise<FeedPost> {
    const excerpt =
      input.kind === "article" && input.content
        ? input.content.slice(0, 200)
        : undefined;

    if (!hasDb()) return memCreate(input, excerpt);

    try {
      const [res]: any = await useDb()
        .insert(feedPosts)
        .values({
          kind: input.kind,
          authorId: input.authorId ?? null,
          authorName: input.author,
          authorHandle: input.handle,
          title: input.title ?? null,
          body: input.kind === "article" ? (excerpt ?? null) : input.body,
          content: input.content ?? null,
          up: 0,
          replies: 0,
        });

      const id = res?.insertId ? String(res.insertId) : `db${Date.now()}`;
      return {
        id,
        kind: input.kind,
        author: input.author,
        handle: input.handle,
        ago: "только что",
        title: input.title,
        body: input.kind === "article" ? excerpt : input.body,
        excerpt,
        content: input.content
          ? input.content.split(/\n\n+/).filter(Boolean)
          : undefined,
        up: 0,
        replies: 0,
      };
    } catch (e) {
      // база недоступна — публикуем во временную память, чтобы UX не ломался
      if (isConnError(e)) return memCreate(input, excerpt);
      throw e;
    }
  },
});
