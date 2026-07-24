/**
 * Диагностика окружения: что настроено, а что нет.
 *   npm run doctor
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m, fix) => { console.log(`  \x1b[31m✗\x1b[0m ${m}`); if (fix) console.log(`     → ${fix}`); FAILED++ }
const info = (m) => console.log(`    ${m}`)
let FAILED = 0

console.log('\n═══ Проверка окружения Dustore ═══\n')

/* ── 1. .env ── */
console.log('1. Файл .env')
const envPath = resolve('.env')
if (!existsSync(envPath)) {
  bad('.env не найден', 'создай .env в корне проекта (см. LOCAL.md)')
} else {
  const raw = readFileSync(envPath)

  // главная ловушка Windows: PowerShell пишет UTF-16, dotenv его не читает
  const utf16 = raw[0] === 0xFF && raw[1] === 0xFE
  const utf16be = raw[0] === 0xFE && raw[1] === 0xFF
  const bom = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF

  if (utf16 || utf16be) {
    bad('.env сохранён в UTF-16 — переменные НЕ читаются',
      'пересохрани в UTF-8: в VS Code снизу справа кликни кодировку → Save with Encoding → UTF-8')
  } else {
    let text = raw.toString('utf8')
    if (bom) { info('есть BOM — не страшно, но лучше без него'); text = text.slice(1) }

    // ловим кракозябры: типичные последовательности cp1251-как-utf8
    if (/[Ð�Ñ‚Ð°Ñ€]{2,}|Р[°-Ÿ]|в”|в•/.test(text)) {
      info('\x1b[33m⚠ в .env кракозябры в комментариях\x1b[0m — на переменные не влияет, но лучше пересохранить в UTF-8')
    }
    ok('.env найден, кодировка читаемая')

    const vars = Object.fromEntries(
      text.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
        .filter(([k]) => k),
    )

    if (!vars.DATABASE_URL) bad('DATABASE_URL не найден в .env', 'DATABASE_URL="mysql://root:@localhost:3306/dustorev3"')
    else {
      ok(`DATABASE_URL = ${vars.DATABASE_URL.replace(/:\/\/[^@]*@/, '://***@')}`)
      globalThis.__url = vars.DATABASE_URL
    }

    if (!vars.NUXT_SESSION_SECRET) bad('NUXT_SESSION_SECRET не найден', 'любая строка от 32 символов')
    else if (vars.NUXT_SESSION_SECRET.length < 32) bad(`NUXT_SESSION_SECRET короче 32 символов (${vars.NUXT_SESSION_SECRET.length})`)
    else ok('NUXT_SESSION_SECRET на месте')
  }
}

/* ── 2. миграции ── */
console.log('\n2. Файлы миграций')
if (!existsSync('drizzle')) bad('нет папки drizzle/', 'скопируй drizzle/ из выдачи')
else {
  const sql = readdirSync('drizzle').filter(f => f.endsWith('.sql'))
  if (!sql.length) bad('в drizzle/ нет .sql файлов')
  else ok(`миграций: ${sql.length} (${sql.join(', ')})`)
  if (!existsSync('drizzle/meta/_journal.json')) bad('нет drizzle/meta/_journal.json')
  else ok('журнал миграций на месте')
}
if (!existsSync('drizzle.config.ts')) bad('нет drizzle.config.ts в корне')
else ok('drizzle.config.ts найден')

/* ── 3. подключение к базе ── */
console.log('\n3. Подключение к MySQL')
const url = globalThis.__url
if (!url) {
  info('пропускаю — нет DATABASE_URL')
} else {
  try {
    const mysql = (await import('mysql2/promise')).default

    // разбираем адрес аккуратно, сохраняя параметры (?socketPath и т.п.)
    const u = new URL(url)
    const dbName = decodeURIComponent(u.pathname.slice(1))

    // подключаемся БЕЗ имени базы, чтобы отличить «нет сервера» от «нет базы»
    const noDb = new URL(url)
    noDb.pathname = '/'
    const conn = await mysql.createConnection(noDb.toString())
    ok('MySQL отвечает')

    const [rows] = await conn.query('SHOW DATABASES')
    const has = rows.some(r => Object.values(r)[0] === dbName)
    if (!has) {
      bad(`базы «${dbName}» нет`,
        `CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    } else {
      ok(`база «${dbName}» существует`)
      await conn.changeUser({ database: dbName })
      const [tables] = await conn.query('SHOW TABLES')
      const names = tables.map(t => Object.values(t)[0])
      if (!names.length) bad('база пустая, таблиц нет — миграции не применены', 'npm run db:migrate')
      else {
        ok(`таблиц: ${names.length} (${names.join(', ')})`)
        if (!names.includes('users')) {
          bad('нет таблицы users — это база старого сайта?', 'проверь DATABASE_URL')
        } else {
          const [uc] = await conn.query('SELECT COUNT(*) c FROM users')
          ok(`пользователей в users: ${uc[0].c}`)
        }
        if (names.includes('__drizzle_migrations')) {
          const [m] = await conn.query('SELECT COUNT(*) c FROM __drizzle_migrations')
          const applied = Number(m[0].c)
          const onDisk = readdirSync('drizzle').filter(f => f.endsWith('.sql')).length
          if (applied < onDisk) bad(`применено ${applied} миграций из ${onDisk}`, 'npm run db:migrate')
          else ok(`применено миграций: ${applied} из ${onDisk}`)
        } else {
          bad('нет служебной таблицы __drizzle_migrations', 'npm run db:migrate')
        }
      }
    }
    await conn.end()
  } catch (e) {
    bad(`не удалось подключиться: ${e.code || e.message}`,
      e.code === 'ECONNREFUSED' ? 'MySQL не запущен — включи его в панели XAMPP'
      : e.code === 'ER_ACCESS_DENIED_ERROR' ? 'неверный логин или пароль в DATABASE_URL'
      : 'проверь DATABASE_URL')
  }
}

/* ── 5. проверка конкретной почты ── */
const checkIdx = process.argv.indexOf('--login')
if (checkIdx !== -1 && globalThis.__url) {
  const email = (process.argv[checkIdx + 1] || '').toLowerCase()
  const pass = process.argv[checkIdx + 2]

  console.log(`\n5. Проверка входа: ${email}`)
  if (!email) {
    bad('не указана почта', 'node scripts/doctor.mjs --login почта@пример.ру [пароль]')
  } else {
    const mysql = (await import('mysql2/promise')).default
    const conn = await mysql.createConnection(globalThis.__url)
    const legacyDb = process.env.LEGACY_DB || 'dustore'

    // а) новая база
    const [newRows] = await conn.query('SELECT id, nick, legacy_id FROM users WHERE email = ?', [email])
    if (newRows.length) {
      ok(`есть в НОВОЙ базе: id=${newRows[0].id}, ник=${newRows[0].nick}, legacy_id=${newRows[0].legacy_id ?? '—'}`)
      info('вход должен работать текущим паролем этого аккаунта')
    } else {
      info('в новой базе нет — значит, должен сработать переезд из старой')
    }

    // б) старая база
    try {
      const [oldRows] = await conn.query(
        `SELECT id, username, email, password FROM \`${legacyDb}\`.users WHERE email = ?`, [email])
      if (!oldRows.length) {
        bad(`в старой базе «${legacyDb}» такой почты НЕТ`,
          'проверь, ту ли базу смотришь: SELECT email FROM ' + legacyDb + '.users LIMIT 5')
        const [sample] = await conn.query(`SELECT email FROM \`${legacyDb}\`.users LIMIT 5`)
        info('первые почты в старой базе: ' + sample.map(r => r.email).join(', '))
      } else {
        const u = oldRows[0]
        ok(`есть в СТАРОЙ базе: id=${u.id}, username=${u.username}`)
        const hash = u.password || ''
        info(`хеш пароля: ${hash.slice(0, 7)}… (${hash.length} символов)`)
        if (!hash) bad('пароль пустой — войти по паролю нельзя (аккаунт только через Telegram?)')
        else if (!/^\$2[aby]\$/.test(hash)) bad(`хеш не bcrypt (${hash.slice(0, 4)}) — нужен отдельный способ проверки`)
        else if (pass) {
          const bcrypt = (await import('bcryptjs')).default
          const norm = hash.startsWith('$2y$') ? '$2b$' + hash.slice(4) : hash
          const match = await bcrypt.compare(pass, norm)
          if (match) ok('ПАРОЛЬ ПОДХОДИТ — вход должен сработать')
          else bad('пароль НЕ подходит к этому хешу', 'попробуй другой пароль')
        } else {
          info('чтобы проверить пароль: node scripts/doctor.mjs --login ' + email + ' ТВОЙПАРОЛЬ')
        }
      }
    } catch (e) {
      const code = e.code ?? e.cause?.code
      bad(`старая база недоступна: ${code}`,
        code === 'ER_NO_SUCH_TABLE' || code === 'ER_BAD_DB_ERROR'
          ? `базы «${legacyDb}» нет локально — импортируй дамп или проверяй на сервере`
          : 'проверь права доступа')
    }
    await conn.end()
  }
}

console.log(FAILED
  ? `\n\x1b[31m═══ Проблем: ${FAILED} ═══\x1b[0m\n`
  : '\n\x1b[32m═══ Всё готово, можно запускать npm run dev ═══\x1b[0m\n')
process.exit(FAILED ? 1 : 0)
