/**
 * Мобильные игры и приложения. Раздел /apps.
 * На ПК — обычный каталог с квадратными иконками (вместо обложек).
 * Страница /apps/:id стилизована под app-store листинг.
 * Пока статические демо-данные (как GAMES); позже — из своих таблиц.
 */

export interface MobileApp {
  id: string;
  name: string;
  developer: string; // handle разработчика (ведёт в профиль)
  category: string; // человекочитаемая, ru
  isGame: boolean;
  icon: string; // css-фон иконки (градиент/цвет)
  glyph: string; // 1–2 символа на иконке
  rating: number;
  ratingCount: number;
  downloads: string; // «12к», «1.4М»
  size: string;
  age: "4+" | "12+" | "17+";
  price: number; // ₽, 0 = бесплатно
  platform: "ios" | "android" | "both";
  tagline: string; // короткое описание под иконкой
  desc: string; // полное описание
  whatsNew: string;
  version: string;
  updated: string; // дата строкой
  langs: string[];
  shots: string[]; // цвета скриншотов (телефонный формат)
  pick?: boolean; // выбор редакции
  rank?: number; // место в категории
}

const APPS: MobileApp[] = [
  {
    id: "lumen",
    name: "Люмен",
    developer: "rosa",
    category: "Головоломки",
    isGame: true,
    icon: "linear-gradient(145deg, #7a2f55, #c32178)",
    glyph: "Л",
    rating: 4.7,
    ratingCount: 3120,
    downloads: "120к",
    size: "48 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Головоломки о свете и тени",
    desc: "Веди луч через 120 уровней, отражая его зеркалами и призмами. Никаких таймеров и жизней — только вы и задача. Ручная анимация, тихий эмбиент и режим дальтоника.",
    whatsNew: "20 новых уровней в главе «Сумерки» и поддержка тактильной отдачи.",
    version: "2.4.1",
    updated: "28.07.2026",
    langs: ["русский", "english", "қазақша"],
    shots: ["#3A1030", "#5c2340", "#7a2f55", "#c32178"],
    pick: true,
    rank: 2,
  },
  {
    id: "notely",
    name: "Notely",
    developer: "theo",
    category: "Продуктивность",
    isGame: false,
    icon: "linear-gradient(145deg, #243b6e, #378add)",
    glyph: "N",
    rating: 4.5,
    ratingCount: 8800,
    downloads: "1.4М",
    size: "22 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Заметки со скоростью мысли",
    desc: "Быстрые заметки в маркдауне, локально и без аккаунта. Мгновенный поиск, связи между заметками и виджет на экран блокировки. Ваши данные остаются на устройстве.",
    whatsNew: "Виджеты на iOS 18, экспорт в PDF и тёмная тема по расписанию.",
    version: "5.0.0",
    updated: "30.07.2026",
    langs: ["русский", "english"],
    shots: ["#14243f", "#1c3358", "#243b6e", "#378add"],
    pick: true,
    rank: 1,
  },
  {
    id: "mossgo",
    name: "Мох в кармане",
    developer: "nick",
    category: "Игры · Приключения",
    isGame: true,
    icon: "linear-gradient(145deg, #153631, #1D9E75)",
    glyph: "🌿",
    rating: 4.8,
    ratingCount: 5400,
    downloads: "340к",
    size: "180 МБ",
    age: "4+",
    price: 0,
    platform: "ios",
    tagline: "Уютный стелс на ходу",
    desc: "Карманная версия «Мох и Машина»: короткие уровни по 3–5 минут, управление одним пальцем и облачные сохранения между устройствами. Прячься в тенях и не буди машину.",
    whatsNew: "Глава на заброшенной оранжерее и режим «одна рука».",
    version: "1.3.0",
    updated: "18.07.2026",
    langs: ["русский", "english"],
    shots: ["#0f241f", "#153631", "#1E4A44", "#1D9E75"],
    pick: true,
    rank: 3,
  },
  {
    id: "beatloop",
    name: "BeatLoop",
    developer: "mara",
    category: "Музыка",
    isGame: false,
    icon: "linear-gradient(145deg, #4a1e1e, #e24b4a)",
    glyph: "♪",
    rating: 4.3,
    ratingCount: 2100,
    downloads: "88к",
    size: "64 МБ",
    age: "4+",
    price: 299,
    platform: "both",
    tagline: "Луп-станция в кармане",
    desc: "Многодорожечный сэмплер и секвенсор. Записывай слои, тяни темп жестом и экспортируй в WAV. Работает офлайн, латентность ниже 10 мс.",
    whatsNew: "MIDI по Bluetooth и 12 новых наборов ударных.",
    version: "3.1.2",
    updated: "22.07.2026",
    langs: ["русский", "english"],
    shots: ["#2a1010", "#4a1e1e", "#6b2a2a", "#e24b4a"],
  },
  {
    id: "orbita",
    name: "Орбита",
    developer: "alex",
    category: "Игры · Симуляторы",
    isGame: true,
    icon: "linear-gradient(145deg, #14243f, #185fa5)",
    glyph: "◐",
    rating: 4.1,
    ratingCount: 940,
    downloads: "32к",
    size: "210 МБ",
    age: "12+",
    price: 0,
    platform: "android",
    tagline: "Орбитальная механика на пальцах",
    desc: "Планируй манёвры, лови гравитацию и выводи спутники на орбиту. Честная физика, никакой доната. Для тех, кто любит считать дельту скорости.",
    whatsNew: "Песочница со свободным построением и импорт реальных орбит.",
    version: "0.9.4",
    updated: "19.07.2026",
    langs: ["русский", "english"],
    shots: ["#0c1830", "#14243f", "#1b3560", "#185fa5"],
  },
  {
    id: "focusgarden",
    name: "Сад Фокуса",
    developer: "june",
    category: "Здоровье",
    isGame: false,
    icon: "linear-gradient(145deg, #27500a, #97C459)",
    glyph: "❀",
    rating: 4.6,
    ratingCount: 6700,
    downloads: "560к",
    size: "40 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Растим внимание, а не тревогу",
    desc: "Помидорный таймер, который выращивает сад за каждый сфокусированный отрезок. Мягкие звуки, статистика недели и совместные сессии с друзьями.",
    whatsNew: "Совместные комнаты фокуса и новые растения сезона.",
    version: "4.2.0",
    updated: "26.07.2026",
    langs: ["русский", "english", "қазақша"],
    shots: ["#16340a", "#27500a", "#3B6D11", "#97C459"],
  },
  {
    id: "pixelpet",
    name: "Пиксельный Питомец",
    developer: "rosa",
    category: "Игры · Казуальные",
    isGame: true,
    icon: "linear-gradient(145deg, #52401f, #EF9F27)",
    glyph: "P",
    rating: 4.4,
    ratingCount: 15600,
    downloads: "2.1М",
    size: "36 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Тамагочи для взрослых",
    desc: "Заботься о пиксельном существе: корми, играй, наблюдай, как оно растёт. Живёт в реальном времени, шлёт уведомления и умеет грустить, если о нём забыли.",
    whatsNew: "Пять новых питомцев и комната-мастерская для декора.",
    version: "6.7.1",
    updated: "29.07.2026",
    langs: ["русский", "english"],
    shots: ["#2f2510", "#52401f", "#6e572a", "#EF9F27"],
    rank: 4,
  },
  {
    id: "signalfm",
    name: "Signal FM",
    developer: "theo",
    category: "Игры · Аудио",
    isGame: true,
    icon: "linear-gradient(145deg, #1f1535, #7F77DD)",
    glyph: "◎",
    rating: 4.9,
    ratingCount: 780,
    downloads: "12к",
    size: "28 МБ",
    age: "12+",
    price: 199,
    platform: "ios",
    tagline: "Игра, которую надо слушать",
    desc: "Аудио-приключение без графики. Ориентируйся по звуку, эху и направлению шума. Наушники обязательны. Полная поддержка VoiceOver — играют и незрячие.",
    whatsNew: "Новая глава «Радиомолчание» и пространственный звук.",
    version: "1.1.0",
    updated: "17.07.2026",
    langs: ["русский", "english"],
    shots: ["#140d24", "#1f1535", "#2c2050", "#7F77DD"],
    pick: true,
  },
  {
    id: "snapsort",
    name: "SnapSort",
    developer: "sana",
    category: "Фото",
    isGame: false,
    icon: "linear-gradient(145deg, #14243f, #5DCAA5)",
    glyph: "S",
    rating: 4.2,
    ratingCount: 3300,
    downloads: "210к",
    size: "54 МБ",
    age: "4+",
    price: 0,
    platform: "android",
    tagline: "Разбор галереи одним свайпом",
    desc: "Свайп влево — удалить, вправо — оставить. Находит дубликаты и размытые кадры на устройстве, ничего не выгружая в облако. Освободите память за вечер.",
    whatsNew: "Умные альбомы и пакетное сжатие без потери качества.",
    version: "2.0.3",
    updated: "24.07.2026",
    langs: ["русский", "english"],
    shots: ["#0c1c2a", "#14243f", "#1a3b4a", "#5DCAA5"],
  },
  {
    id: "quilt",
    name: "Лоскутное",
    developer: "rosa",
    category: "Игры · Головоломки",
    isGame: true,
    icon: "linear-gradient(145deg, #291c38, #AFA9EC)",
    glyph: "◇",
    rating: 4.5,
    ratingCount: 1200,
    downloads: "48к",
    size: "24 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Сшей одеяло из воспоминаний",
    desc: "Каждый лоскут — чей-то день. Складывай так, чтобы истории не спорили. Медитативная головоломка без проигрыша: есть только другие сочетания.",
    whatsNew: "Сезонные лоскуты и общий альбом с друзьями.",
    version: "1.4.0",
    updated: "21.07.2026",
    langs: ["русский", "english"],
    shots: ["#1a1226", "#291c38", "#3d2a52", "#AFA9EC"],
  },
  {
    id: "tallyca",
    name: "Tally",
    developer: "alex",
    category: "Финансы",
    isGame: false,
    icon: "linear-gradient(145deg, #14243f, #1D9E75)",
    glyph: "₸",
    rating: 4.7,
    ratingCount: 4100,
    downloads: "180к",
    size: "18 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Учёт денег без нервов",
    desc: "Быстрый ввод трат в два тапа, бюджеты по конвертам и понятные графики. Всё считается на устройстве, банк подключать не нужно. Экспорт в CSV.",
    whatsNew: "Мультивалютность и виджет остатка на неделю.",
    version: "3.3.0",
    updated: "27.07.2026",
    langs: ["русский", "english", "қазақша"],
    shots: ["#0c1c2a", "#14243f", "#153631", "#1D9E75"],
  },
  {
    id: "kite",
    name: "Бумажный Змей",
    developer: "june",
    category: "Игры · Аркады",
    isGame: true,
    icon: "linear-gradient(145deg, #16343e, #5DCAA5)",
    glyph: "K",
    rating: 4.5,
    ratingCount: 640,
    downloads: "24к",
    size: "12 МБ",
    age: "4+",
    price: 0,
    platform: "both",
    tagline: "Лови ветер, не порви нить",
    desc: "Одна кнопка, бесконечное небо и очень честная физика ветра. Идеальная игра на пять минут в очереди. Работает даже на старых устройствах.",
    whatsNew: "Ночной режим и таблица рекордов среди друзей.",
    version: "1.2.0",
    updated: "20.07.2026",
    langs: ["русский", "english"],
    shots: ["#0d2027", "#16343e", "#1f4a58", "#5DCAA5"],
  },
];

export const APP_CATEGORIES = [...new Set(APPS.map((a) => a.category))].sort();

export const findApp = (id: string) => APPS.find((a) => a.id === id);

export const featuredApps = () => APPS.filter((a) => a.pick);

export const topApps = (n = 8) =>
  [...APPS].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, n);

export const gameApps = () => APPS.filter((a) => a.isGame);
export const toolApps = () => APPS.filter((a) => !a.isGame);

export const byCategory = (cat: string) =>
  APPS.filter((a) => a.category === cat);

export const similarApps = (app: MobileApp, n = 6) =>
  APPS.filter((a) => a.id !== app.id && a.developer === app.developer)
    .concat(
      APPS.filter(
        (a) => a.id !== app.id && a.developer !== app.developer && a.isGame === app.isGame,
      ),
    )
    .slice(0, n);

export const priceLabel = (p: number) =>
  p === 0 ? "Загрузить" : `${p.toLocaleString("ru-RU")} ₽`;

export const platformLabel = (p: MobileApp["platform"]) =>
  p === "both" ? "iOS · Android" : p === "ios" ? "iOS" : "Android";

export { APPS };
