import bcrypt from "bcryptjs";

/**
 * Проверка пароля с поддержкой хешей из старого PHP.
 *
 * ЛОВУШКА: PHP password_hash() выдаёт хеши с префиксом $2y$,
 * а библиотеки Node ждут $2a$ / $2b$. Алгоритм тот же —
 * отличается только буква. Поэтому подменяем префикс перед проверкой,
 * иначе все старые пароли будут «неверными».
 */
export async function verifyPassword(
  plain: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) return false;
  const normalized = hash.startsWith("$2y$") ? "$2b$" + hash.slice(4) : hash;
  try {
    return await bcrypt.compare(plain, normalized);
  } catch {
    return false;
  }
}

/** новые пароли храним современным bcrypt с 12 раундами */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function validNick(v: string) {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(v);
}
