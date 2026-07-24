import type { H3Event } from "h3";

const CFG = () => ({
  password:
    process.env.NUXT_SESSION_SECRET || "dev-only-secret-change-me-32-chars-min",
  name: "dustore_session",
  cookie: {
    httpOnly: true, // JS в браузере не может прочитать — защита от кражи через XSS
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

export async function setUserSession(event: H3Event, userId: number) {
  const s = await useSession(event, CFG());
  await s.update({ userId });
}

export async function getUserId(event: H3Event): Promise<number | null> {
  const s = await useSession(event, CFG());
  return (s.data as any)?.userId ?? null;
}

export async function clearUserSession(event: H3Event) {
  const s = await useSession(event, CFG());
  await s.clear();
}
