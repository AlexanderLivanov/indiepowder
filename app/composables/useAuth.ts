import type { SessionUser } from "~~/server/utils/store";

/** Единое состояние входа на всё приложение. */
export function useAuth() {
  const user = useState<SessionUser | null>("auth:user", () => null);
  const pending = useState("auth:pending", () => false);

  /**
   * Спрашивает у сервера, кто вошёл.
   *
   * ⚠️ ЗДЕСЬ БЫЛ БАГ: обычный $fetch во время отрисовки на сервере
   * НЕ передаёт cookie браузера. Сервер спрашивал «кто вошёл?» без
   * cookie сессии, получал null — и после каждой перезагрузки страницы
   * пользователь выглядел разлогиненным.
   *
   * useRequestFetch() пробрасывает заголовки исходного запроса
   * (включая Cookie), поэтому сессия видна и при серверной отрисовке.
   */
  async function fetchUser() {
    try {
      const request = useRequestFetch();
      const r = await request<{ user: SessionUser | null }>("/api/auth/me");
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
      return {
        ok: false as const,
        code: e?.statusMessage || e?.data?.statusMessage || "ERROR",
      };
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
      return {
        ok: false as const,
        code: e?.statusMessage || e?.data?.statusMessage || "ERROR",
      };
    } finally {
      pending.value = false;
    }
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }

  /** завершение Telegram-входа: пользователь ввёл email (нового аккаунта) */
  async function telegramComplete(token: string, email: string) {
    pending.value = true;
    try {
      const r = await $fetch<{ user: SessionUser }>(
        "/api/auth/telegram/complete",
        { method: "POST", body: { token, email } },
      );
      user.value = r.user;
      return { ok: true as const };
    } catch (e: any) {
      return {
        ok: false as const,
        code: e?.statusMessage || e?.data?.statusMessage || "ERROR",
      };
    } finally {
      pending.value = false;
    }
  }

  async function saveProfile(patch: Record<string, string>) {
    const r = await $fetch<{ user: SessionUser }>("/api/profile", {
      method: "PATCH",
      body: patch,
    });
    user.value = r.user;
    return r.user;
  }

  return {
    user,
    pending,
    fetchUser,
    login,
    register,
    logout,
    saveProfile,
    telegramComplete,
  };
}
