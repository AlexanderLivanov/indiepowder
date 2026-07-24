import type { SessionUser } from "~~/server/utils/store";

/** Единое состояние входа на всё приложение. */
export function useAuth() {
  const user = useState<SessionUser | null>("auth:user", () => null);
  const pending = useState("auth:pending", () => false);

  /** подтягиваем сессию с сервера (вызывается плагином при старте) */
  async function fetchUser() {
    try {
      const r = await $fetch<{ user: SessionUser | null }>("/api/auth/me");
      user.value = r.user;
    } catch {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    pending.value = true;
    try {
      const r = await $fetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      user.value = r.user;
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, code: e?.statusMessage || "ERROR" };
    } finally {
      pending.value = false;
    }
  }

  async function register(nick: string, email: string, password: string) {
    pending.value = true;
    try {
      const r = await $fetch<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: { nick, email, password },
      });
      user.value = r.user;
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, code: e?.statusMessage || "ERROR" };
    } finally {
      pending.value = false;
    }
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }

  return { user, pending, fetchUser, login, register, logout };
}
