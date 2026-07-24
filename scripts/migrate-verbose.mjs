/**
 * Применяет миграции ПО ОДНОМУ ЗАПРОСУ и показывает,
 * какой именно упал и с какой ошибкой MySQL.
 *
 *   node scripts/migrate-verbose.mjs           — применить
 *   node scripts/migrate-verbose.mjs --reset   — сначала снести все таблицы
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import process from 'node:process'
import mysql from 'mysql2/promise'

// читаем .env руками, без зависимостей
if (existsSync('.env')) {
  const raw = readFileSync('.env')
  if (raw[0] === 0xFF && raw[1] === 0xFE) {
    console.error('\x1b[31m.env в UTF-16 — пересохрани в UTF-8\x1b[0m'); process.exit(1)
  }
  for (const line of raw.toString('utf8').replace(/^\uFEFF/, '').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
}

const url = process.env.DATABASE_URL
if (!url) { console.error('\x1b[31mНет DATABASE_URL в .env\x1b[0m'); process.exit(1) }

const conn = await mysql.createConnection({ uri: url, multipleStatements: false })
console.log('\n═══ Применение миграций ═══\n')

/* ── --reset: сносим всё и начинаем с нуля ── */
if (process.argv.includes('--reset')) {
  console.log('\x1b[33m⚠ режим --reset: сношу все таблицы\x1b[0m')
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  const [tables] = await conn.query('SHOW TABLES')
  for (const t of tables) {
    const name = Object.values(t)[0]
    await conn.query(`DROP TABLE IF EXISTS \`${name}\``)
    console.log(`  удалил ${name}`)
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')
  console.log()
}

/* ── журнал применённых ── */
await conn.query(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash TEXT NOT NULL,
    created_at BIGINT
  )`)
const [done] = await conn.query('SELECT hash FROM __drizzle_migrations')
const applied = new Set(done.map(r => r.hash))

/* ── по файлам ── */
const files = readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()
let failed = false

for (const file of files) {
  if (applied.has(file)) { console.log(`\x1b[90m⤳ ${file} — уже применена\x1b[0m`); continue }

  console.log(`▸ ${file}`)
  const sql = readFileSync(`drizzle/${file}`, 'utf8')
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)

  for (const [i, stmt] of statements.entries()) {
    const short = stmt.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await conn.query(stmt)
      console.log(`  \x1b[32m✓\x1b[0m [${i + 1}/${statements.length}] ${short}…`)
    } catch (e) {
      console.log(`  \x1b[31m✗\x1b[0m [${i + 1}/${statements.length}] ${short}…`)
      console.log(`\n\x1b[31m════ ОШИБКА MySQL ════\x1b[0m`)
      console.log(`  код:      ${e.code}`)
      console.log(`  сообщение: ${e.sqlMessage || e.message}`)
      console.log(`\n  Полный запрос:\n${stmt}\n`)
      failed = true
      break
    }
  }
  if (failed) break

  await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [file, Date.now()])
  console.log(`  \x1b[32mзаписал в журнал\x1b[0m\n`)
}

const [tables] = await conn.query('SHOW TABLES')
console.log('Таблицы сейчас:', tables.map(t => Object.values(t)[0]).join(', '))
await conn.end()

console.log(failed
  ? '\n\x1b[31m═══ Прервано на ошибке выше ═══\x1b[0m\n'
  : '\n\x1b[32m═══ Все миграции применены ═══\x1b[0m\n')
process.exit(failed ? 1 : 0)
