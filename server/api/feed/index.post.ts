import { useFeedStore, type FeedKind } from "../../db/feed";
import { publicUser, useStore } from "../../utils/store";
import { getUserId } from "../../utils/session";

const KINDS: FeedKind[] = ["spark", "note", "article", "line", "thread"];

/**
 * Публикация в ленту. Автор берётся из сессии; гость публиковать не может.
 * kind=article ждёт title + content, остальные — body.
 */
export default defineEventHandler(async (event) => {
  const id = await getUserId(event);
  if (!id) throw createError({ statusCode: 401, statusMessage: "NOT_AUTHED" });

  const row = await useStore().findById(id);
  if (!row) throw createError({ statusCode: 401, statusMessage: "NOT_AUTHED" });
  const me = publicUser(row);

  const b = await readBody<{
    kind?: string;
    title?: string;
    body?: string;
    content?: string;
  }>(event);

  const kind: FeedKind =
    b.kind && KINDS.includes(b.kind as FeedKind) ? (b.kind as FeedKind) : "note";

  const body = (b.body ?? "").trim();
  const content = (b.content ?? "").trim();
  const title = (b.title ?? "").trim();

  if (kind === "article") {
    if (!title) throw createError({ statusCode: 400, statusMessage: "NO_TITLE" });
    if (content.length < 50)
      throw createError({ statusCode: 400, statusMessage: "TOO_SHORT" });
  } else if (!body) {
    throw createError({ statusCode: 400, statusMessage: "EMPTY" });
  }

  const post = await useFeedStore().create({
    kind,
    authorId: me.id,
    author: me.displayName || me.nick,
    handle: "@" + me.nick,
    title: kind === "article" ? title : undefined,
    body: kind === "article" ? content : body,
    content: kind === "article" ? content : undefined,
  });

  return { post };
});
