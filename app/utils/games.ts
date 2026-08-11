export interface Game {
  id: string;
  title: string;
  author: string;
  tags: string[];
  plays: number; // сколько раз запускали
  shows: number; // сколько раз ПОКАЗАЛИ в ленте — основа честной выдачи
  rating: number;
  votes: number;
  price: number;
  cover: string;
  date: number; // YYYYMMDD
  desc: string;
  shortDescription?: string; // короткое описание (у реальных игр из БД)
  about: string;
  shots: string[];
  engine: string;
  size: string;
  web: boolean;
  jam?: string; // если игра победила на джеме
  pick?: boolean; // выбор редакции
}

const S = (a: string, b: string, c: string) => [a, b, c];

export const GAMES: Game[] = [
  {
    id: "moss",
    title: "Мох и Машина",
    author: "nick",
    tags: ["уют", "стелс", "godot"],
    plays: 1840,
    shows: 24100,
    rating: 4.6,
    votes: 212,
    price: 0,
    cover: "#3A2F6E",
    date: 20260710,
    engine: "Godot 4.3",
    size: "84 МБ",
    web: true,
    pick: true,
    jam: "powder jam #12",
    desc: "Уютный стелс на заброшенной фабрике, поросшей мхом.",
    about:
      "Прячься в тенях, читай ритм патрулей и найди выход, не разбудив спящую машину. Ни одного убийства — только терпение и наблюдение.",
    shots: S("#3A2F6E", "#4a3a86", "#2a2050"),
  },
  {
    id: "teacup",
    title: "Полый Напёрсток",
    author: "sana",
    tags: ["хоррор", "сюжет"],
    plays: 980,
    shows: 15300,
    rating: 4.1,
    votes: 96,
    price: 0,
    cover: "#5c2340",
    date: 20260702,
    engine: "Ink + Unity",
    size: "32 МБ",
    web: true,
    desc: "Текстовый хоррор с ветвлением.",
    about:
      "Каждый выбор оставляет трещину, которую уже не склеить. Четыре концовки, ни одна не добрая.",
    shots: S("#5c2340", "#7a2f55", "#42192e"),
  },
  {
    id: "moth",
    title: "Мотель Мотылька",
    author: "rosa",
    tags: ["пиксель", "сим"],
    plays: 640,
    shows: 3100,
    rating: 4.4,
    votes: 71,
    price: 399,
    cover: "#1E4A44",
    date: 20260624,
    engine: "GameMaker",
    size: "58 МБ",
    web: true,
    desc: "Управляй мотелем для ночных существ.",
    about:
      "Пиксель-арт, тихая музыка и очень странные постояльцы. Каждую ночь кто-то заселяется — и не каждый уезжает.",
    shots: S("#1E4A44", "#286058", "#153631"),
  },
  {
    id: "rustfall",
    title: "Ржавый Листопад",
    author: "alex",
    tags: ["экшен", "rust"],
    plays: 2410,
    shows: 31200,
    rating: 4.8,
    votes: 340,
    price: 599,
    cover: "#243b6e",
    date: 20260618,
    engine: "Rust + Bevy",
    size: "210 МБ",
    web: false,
    pick: true,
    desc: "Быстрый экшен с детерминированной физикой.",
    about:
      "Сетевая игра на лок-степе: одинаковый результат на всех машинах. Отзывчивое управление — главный приоритет.",
    shots: S("#243b6e", "#2f4f92", "#1a2b50"),
  },
  {
    id: "pico",
    title: "Пикоквест 8",
    author: "mara",
    tags: ["pico-8", "rpg"],
    plays: 1120,
    shows: 9800,
    rating: 4.2,
    votes: 118,
    price: 0,
    cover: "#6e5423",
    date: 20260615,
    engine: "PICO-8",
    size: "1.2 МБ",
    web: true,
    desc: "RPG, втиснутая в 8192 токена.",
    about:
      "Диалоговые деревья, пошаговые бои и три секретных подземелья в крошечной фантазийной консоли.",
    shots: S("#6e5423", "#8f6d2e", "#503c19"),
  },
  {
    id: "signal",
    title: "Потерянный Сигнал",
    author: "theo",
    tags: ["звук", "эксперимент"],
    plays: 420,
    shows: 1900,
    rating: 4.7,
    votes: 54,
    price: 0,
    cover: "#2c1e4a",
    date: 20260719,
    engine: "SuperCollider",
    size: "18 МБ",
    web: true,
    desc: "Ты не видишь уровень — ты его слышишь.",
    about:
      "Аудио-эксперимент без графики. Ориентируйся по звуку, эху и направлению шума. Наушники обязательны.",
    shots: S("#2c1e4a", "#3b2a63", "#1f1535"),
  },
  {
    id: "garden",
    title: "Стеклянный Сад",
    author: "june",
    tags: ["уют", "головоломка"],
    plays: 760,
    shows: 4200,
    rating: 4.5,
    votes: 88,
    price: 299,
    cover: "#4a2c1e",
    date: 20260716,
    engine: "Godot 4.2",
    size: "46 МБ",
    web: true,
    jam: "cozy winter jam",
    desc: "Головоломка о преломлении света.",
    about:
      "Собери луч из осколков и оживи стеклянный сад. Сорок уровней, ни одного таймера.",
    shots: S("#4a2c1e", "#653c28", "#351f15"),
  },
  {
    id: "depths",
    title: "Глубины Девяти",
    author: "nick",
    tags: ["рогалик", "godot"],
    plays: 3120,
    shows: 44000,
    rating: 4.7,
    votes: 402,
    price: 899,
    cover: "#1e4a3a",
    date: 20260521,
    engine: "Godot 4.3",
    size: "156 МБ",
    web: false,
    desc: "Рогалик о девяти уровнях затопленной шахты.",
    about:
      "Каждый забег меняет карту, набор предметов и одно правило мира. Смерть переносит один предмет в следующий заход.",
    shots: S("#1e4a3a", "#28644e", "#153629"),
  },
  {
    id: "ember",
    title: "Последний Уголёк",
    author: "rosa",
    tags: ["пиксель", "экшен"],
    plays: 1440,
    shows: 12600,
    rating: 4.3,
    votes: 156,
    price: 449,
    cover: "#5c2340",
    date: 20260514,
    engine: "GameMaker",
    size: "72 МБ",
    web: true,
    desc: "Неси последний огонь через замерзающий мир.",
    about: "Свет — и оружие, и таймер. Чем ярче горишь, тем быстрее гаснешь.",
    shots: S("#5c2340", "#803252", "#3f1830"),
  },
  {
    id: "orbit",
    title: "Низкая Орбита",
    author: "alex",
    tags: ["симулятор", "космос"],
    plays: 890,
    shows: 6700,
    rating: 4.0,
    votes: 77,
    price: 0,
    cover: "#243b6e",
    date: 20260505,
    engine: "Rust + Bevy",
    size: "94 МБ",
    web: true,
    desc: "Симулятор орбитальной механики.",
    about:
      "Для тех, кто любит считать. Один неверный импульс — и ты в облаке Оорта.",
    shots: S("#243b6e", "#31509a", "#182a4d"),
  },
  {
    id: "loom",
    title: "Ткацкий Станок",
    author: "sana",
    tags: ["головоломка", "уют"],
    plays: 310,
    shows: 1400,
    rating: 4.6,
    votes: 41,
    price: 0,
    cover: "#3d2a52",
    date: 20260721,
    engine: "Godot 4.3",
    size: "28 МБ",
    web: true,
    jam: "powder jam #13",
    desc: "Плети узоры, которые меняют мир вокруг.",
    about:
      "Каждый сотканный узор перестраивает уровень. Ошибок нет — есть другие ткани.",
    shots: S("#3d2a52", "#51386d", "#291c38"),
  },
  {
    id: "kite",
    title: "Бумажный Змей",
    author: "june",
    tags: ["аркада", "уют"],
    plays: 205,
    shows: 980,
    rating: 4.5,
    votes: 33,
    price: 0,
    cover: "#1f4a58",
    date: 20260720,
    engine: "PICO-8",
    size: "0.9 МБ",
    web: true,
    desc: "Лови ветер и не порви нить.",
    about: "Одна кнопка, бесконечное небо и очень честная физика ветра.",
    shots: S("#1f4a58", "#2a6474", "#16343e"),
  },
  {
    id: "furnace",
    title: "Печь",
    author: "theo",
    tags: ["хоррор", "звук"],
    plays: 178,
    shows: 820,
    rating: 4.4,
    votes: 29,
    price: 0,
    cover: "#4a1e1e",
    date: 20260718,
    engine: "Unity",
    size: "110 МБ",
    web: false,
    desc: "Внизу что-то топят. Ты не знаешь чем.",
    about:
      "Хоррор без монстров. Только звук, температура и растущее понимание.",
    shots: S("#4a1e1e", "#642828", "#331515"),
  },
  {
    id: "tram",
    title: "Последний Трамвай",
    author: "mara",
    tags: ["сюжет", "пиксель"],
    plays: 520,
    shows: 2600,
    rating: 4.8,
    votes: 62,
    price: 199,
    cover: "#2a3d52",
    date: 20260714,
    engine: "GameMaker",
    size: "64 МБ",
    web: true,
    pick: true,
    desc: "Довези всех домой до рассвета.",
    about:
      "Ночной маршрут, семь пассажиров и семь историй, которые пересекаются ровно один раз.",
    shots: S("#2a3d52", "#39536e", "#1d2b3a"),
  },
  {
    id: "anvil",
    title: "Наковальня",
    author: "nick",
    tags: ["симулятор", "godot"],
    plays: 660,
    shows: 5100,
    rating: 4.1,
    votes: 74,
    price: 349,
    cover: "#52401f",
    date: 20260610,
    engine: "Godot 4.2",
    size: "88 МБ",
    web: true,
    desc: "Куй мечи, которые помнят своих владельцев.",
    about: "Симулятор кузнеца, где у каждого клинка есть история и характер.",
    shots: S("#52401f", "#6e572a", "#3a2d15"),
  },
  {
    id: "sonar",
    title: "Сонар",
    author: "alex",
    tags: ["эксперимент", "космос"],
    plays: 148,
    shows: 690,
    rating: 4.6,
    votes: 24,
    price: 0,
    cover: "#1e3a4a",
    date: 20260717,
    engine: "Rust + Bevy",
    size: "36 МБ",
    web: true,
    jam: "neon nights",
    desc: "Картографируй пустоту одним импульсом за раз.",
    about:
      "Ты видишь мир только в момент эха. Между импульсами — темнота и память.",
    shots: S("#1e3a4a", "#295064", "#142831"),
  },
  {
    id: "quilt",
    title: "Лоскутное",
    author: "rosa",
    tags: ["уют", "головоломка"],
    plays: 390,
    shows: 2100,
    rating: 4.3,
    votes: 47,
    price: 0,
    cover: "#4a2c42",
    date: 20260626,
    engine: "Godot 4.3",
    size: "24 МБ",
    web: true,
    desc: "Сшей одеяло из чужих воспоминаний.",
    about:
      "Каждый лоскут — чей-то день. Складывай так, чтобы истории не спорили.",
    shots: S("#4a2c42", "#653a59", "#331e2d"),
  },
  {
    id: "relay",
    title: "Эстафета",
    author: "june",
    tags: ["аркада", "экшен"],
    plays: 1010,
    shows: 11200,
    rating: 3.9,
    votes: 108,
    price: 0,
    cover: "#3a4a1e",
    date: 20260602,
    engine: "GameMaker",
    size: "42 МБ",
    web: true,
    desc: "Передай огонь следующему бегуну.",
    about:
      "Кооперативная аркада на одном устройстве. Проигрывает тот, кто уронил.",
    shots: S("#3a4a1e", "#4f6429", "#283314"),
  },
];

export const GAME_TAGS = [...new Set(GAMES.flatMap((g) => g.tags))].sort();

/* ─────────── ПОДБОРКИ ───────────
   Смысл: у каждой игры должен быть раздел, где она первая.
   Поэтому сортируем не только по популярности.                */

/** выбор редакции — ручная кураторская подборка */
export const editorPicks = () => GAMES.filter((g) => g.pick);

/** новинки: свежие по дате. Каждая игра проходит здесь сразу после релиза */
export const freshGames = (n = 8) =>
  [...GAMES].sort((a, b) => b.date - a.date).slice(0, n);

/** победители джемов — заслуга, а не популярность */
export const jamWinners = () => GAMES.filter((g) => g.jam);

/** популярное — обычный топ по запускам */
export const popularGames = (n = 8) =>
  [...GAMES].sort((a, b) => b.plays - a.plays).slice(0, n);

/**
 * НЕЗАМЕЧЕННЫЕ — главный механизм справедливости.
 * Высокий рейтинг при малом числе показов = игра хорошая, но её просто не видели.
 * Сортируем по «дефициту внимания», а не по популярности.
 */
export const hiddenGems = (n = 8) =>
  [...GAMES]
    .filter((g) => g.rating >= 4.2 && g.votes >= 15)
    .map((g) => ({ g, deficit: g.rating / Math.log10(g.shows + 10) }))
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, n)
    .map((x) => x.g);

/** бесплатное и играбельное прямо в браузере */
export const webFree = (n = 8) =>
  GAMES.filter((g) => g.web && g.price === 0).slice(0, n);

/** по тегу: игра, которая 300-я в общем топе, может быть 2-й в своей нише */
export const byTag = (tag: string, n = 8) =>
  GAMES.filter((g) => g.tags.includes(tag)).slice(0, n);

/* ─────────── ЕЖЕДНЕВНАЯ РОТАЦИЯ ───────────
   Перемешивание с зерном от даты: список меняется каждый день,
   но в течение дня стабилен (иначе сервер и браузер отрисуют разное). */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function dailyRotation(n = 8, daySeed?: number) {
  const seed =
    daySeed ?? Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const rnd = seeded(seed);
  // чем меньше показов, тем выше шанс попасть в ротацию
  return [...GAMES]
    .map((g) => ({ g, k: rnd() * Math.log10(g.shows + 10) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map((x) => x.g);
}

export const findGame = (id: string) => GAMES.find((g) => g.id === id);

export const similarGames = (game: Game, n = 4) =>
  GAMES.filter((g) => g.id !== game.id)
    .map((g) => ({
      g,
      score: g.tags.filter((t) => game.tags.includes(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.g.rating - a.g.rating)
    .slice(0, n)
    .map((x) => x.g);

export const fmtPlays = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ═══════════ КОНТЕНТ СТРАНИЦЫ ИГРЫ ═══════════ */

export interface Review {
  user: string;
  hours: number;
  rating: number;
  up: boolean;
  date: string;
  text: string;
  helpful: number;
  verified?: boolean;
}

export interface ExpertReview {
  user: string;
  role: string;
  score: number;
  date: string;
  verdict: string;
  pros: string[];
  cons: string[];
}

export interface VirusScan {
  status: "clean" | "warn" | "pending";
  engines: number;
  flagged: number;
  date: string;
  sha256: string;
}

export interface GameExtra {
  languages: { code: string; ui: boolean; voice: boolean; subs: boolean }[];
  sysreq: { os: string; cpu: string; ram: string; gpu: string; disk: string };
  scan: VirusScan;
  reviews: Review[];
  experts: ExpertReview[];
  updates: { date: string; version: string; title: string }[];
}

const LANGS_BASE = [
  { code: "русский", ui: true, voice: false, subs: true },
  { code: "english", ui: true, voice: false, subs: true },
];

/** данные, специфичные для страницы игры. Позже приедут из своих таблиц */
export const EXTRAS: Record<string, GameExtra> = {
  moss: {
    languages: [
      ...LANGS_BASE,
      { code: "қазақша", ui: true, voice: false, subs: false },
    ],
    sysreq: {
      os: "Windows 10 / Linux / браузер",
      cpu: "любой 64-бит",
      ram: "2 ГБ",
      gpu: "OpenGL 3.3",
      disk: "120 МБ",
    },
    scan: {
      status: "clean",
      engines: 68,
      flagged: 0,
      date: "11.07.2026",
      sha256: "a3f9c2e1d4b7",
    },
    reviews: [
      {
        user: "june",
        hours: 14,
        rating: 5,
        up: true,
        date: "12.07.2026",
        verified: true,
        helpful: 42,
        text: "Первый стелс за долгое время, где меня не наказывают за любопытство. Патрули читаются, ошибки прощаются, а мох реально красивый.",
      },
      {
        user: "alex",
        hours: 6,
        rating: 4,
        up: true,
        date: "13.07.2026",
        helpful: 18,
        text: "Отличная атмосфера. Единственное — в сцене с дождём звук душит всё остальное, приходится крутить громкость.",
      },
      {
        user: "mara",
        hours: 22,
        rating: 5,
        up: true,
        date: "15.07.2026",
        verified: true,
        helpful: 31,
        text: "Прошла три раза, каждый раз находила новый маршрут. Для джем-игры уровень проработки нереальный.",
      },
    ],
    experts: [
      {
        user: "june",
        role: "Битый Пиксель · стелс",
        score: 4.6,
        date: "16.07.2026",
        verdict:
          "Плотный, читаемый стелс с по-настоящему свежей системой внимания противника. Аудио в дождевой сцене требует правки, но фундамент — уровня коммерческого релиза.",
        pros: [
          "Система осведомлённости врагов",
          "Ни одного бесчестного провала",
          "Арт-дирекшен держит тон",
        ],
        cons: ["Пересведение звука в дожде", "Середина проседает по темпу"],
      },
    ],
    updates: [
      {
        date: "18.07.2026",
        version: "1.2.0",
        title: "Переработаны патрули на третьем этаже",
      },
      {
        date: "12.07.2026",
        version: "1.1.0",
        title: "Добавлен казахский интерфейс",
      },
      {
        date: "10.07.2026",
        version: "1.0.0",
        title: "Релиз после powder jam #12",
      },
    ],
  },
};

/** запасной вариант для игр, у которых расширенных данных ещё нет */
export function gameExtra(g: Game): GameExtra {
  if (EXTRAS[g.id]) return EXTRAS[g.id]!;
  return {
    languages: LANGS_BASE,
    sysreq: {
      os: g.web ? "браузер" : "Windows 10+",
      cpu: "любой 64-бит",
      ram: "4 ГБ",
      gpu: "OpenGL 3.3",
      disk: g.size,
    },
    scan: {
      status: "clean",
      engines: 68,
      flagged: 0,
      date: "20.07.2026",
      sha256: "b7e4a19c3f2d",
    },
    reviews: [
      {
        user: "alex",
        hours: 5,
        rating: 4,
        up: true,
        date: "19.07.2026",
        helpful: 9,
        text: "Крепко сделано. Управление отзывчивое, стиль выдержан.",
      },
    ],
    experts: [],
    updates: [{ date: "20.07.2026", version: "1.0.0", title: "Первый релиз" }],
  };
}

export const reviewSummary = (rs: Review[]) => {
  const up = rs.filter((r) => r.up).length;
  const pct = rs.length ? Math.round((up / rs.length) * 100) : 0;
  const label =
    pct >= 90
      ? "крайне положительные"
      : pct >= 70
        ? "в основном положительные"
        : pct >= 40
          ? "смешанные"
          : "отрицательные";
  return { up, total: rs.length, pct, label };
};
