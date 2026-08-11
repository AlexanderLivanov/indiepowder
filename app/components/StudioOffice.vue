<script setup lang="ts">
import { useLocalePath } from '#imports'

/**
 * «Офис студии» в командном центре: участники сидят на рабочих местах.
 * Перетаскивание со снапом к местам (позиции сохраняются), при наведении/тапе —
 * окошко с действиями (дать задачу / профиль / написать).
 */

const localePath = useLocalePath()
const { toast } = useToast()

interface Member { uid: number; name: string; username: string; avatar: string | null; role: string; owner: boolean; working?: string | null }
const { data } = await useFetch<{ members: Member[]; size: string | null }>('/api/console/staff', { default: () => ({ members: [], size: null }) })
const members = computed(() => data.value?.members ?? [])

/* картинка офиса зависит от размера студии; если файла нет — остаётся CSS-сцена */
const size = computed(() => data.value?.size ?? null)
function sizeKey(s: string | null): string {
    if (!s) return 'team'
    if (s === '1') return 'solo'
    if (s === '2-5') return 'team'
    if (s === '6-10') return 'studio'
    return 'large'
}
const officeImg = computed(() => `/office/${sizeKey(size.value)}.webp`)
const imgOk = ref(false) // становится true, когда картинка реально загрузилась

/* рабочие места — редактируемые (устойчивый id + координаты; хранятся локально) */
const DEFAULT_SEATS = [
    { x: 31, y: 46 }, { x: 45, y: 39 }, { x: 31, y: 63 }, { x: 45, y: 56 },
    { x: 63, y: 41 }, { x: 77, y: 34 }, { x: 63, y: 58 }, { x: 77, y: 51 },
    { x: 50, y: 74 }, { x: 66, y: 71 }, { x: 20, y: 34 }, { x: 86, y: 64 },
]
const KEY_SEATS = 'dustore_office_seats'    // uid -> seatId
const KEY_LAYOUT = 'dustore_office_layout'  // [{id,x,y}]
let seatSeq = 0
const seats = reactive<{ id: number; x: number; y: number }[]>([])
const seatOf = reactive<Record<number, number>>({}) // uid -> seatId

function saveLayout() { try { localStorage.setItem(KEY_LAYOUT, JSON.stringify([...seats])) } catch { /* */ } }
function saveSeats() { try { localStorage.setItem(KEY_SEATS, JSON.stringify({ ...seatOf })) } catch { /* */ } }
function freeSeat(used: Set<number>) { return seats.find(s => !used.has(s.id)) }

onMounted(() => {
    // раскладка мест
    let layout: any = null
    try { layout = JSON.parse(localStorage.getItem(KEY_LAYOUT) || 'null') } catch { layout = null }
    if (Array.isArray(layout) && layout.length) {
        layout.forEach((s: any) => seats.push({ id: Number(s.id), x: Number(s.x), y: Number(s.y) }))
        seatSeq = Math.max(...seats.map(s => s.id)) + 1
    } else {
        DEFAULT_SEATS.forEach(d => seats.push({ id: seatSeq++, x: d.x, y: d.y }))
    }
    // рассадка участников
    let saved: Record<number, number> = {}
    try { saved = JSON.parse(localStorage.getItem(KEY_SEATS) || '{}') } catch { saved = {} }
    const ids = new Set(seats.map(s => s.id))
    const used = new Set<number>()
    for (const m of members.value) {
        const sid = saved[m.uid]
        if (typeof sid === 'number' && ids.has(sid) && !used.has(sid)) { seatOf[m.uid] = sid; used.add(sid) }
    }
    for (const m of members.value) {
        if (m.uid in seatOf) continue
        const f = freeSeat(used); if (f) { seatOf[m.uid] = f.id; used.add(f.id) }
    }
})

/* ── редактирование мест ── */
const editing = ref(false)
const dragSeat = ref<number | null>(null)
function addSeat() { seats.push({ id: seatSeq++, x: 50, y: 50 }); saveLayout() }
function removeSeat(id: number) {
    const i = seats.findIndex(s => s.id === id); if (i < 0) return
    seats.splice(i, 1)
    for (const u of Object.keys(seatOf).map(Number)) if (seatOf[u] === id) delete seatOf[u]
    const used = new Set(Object.values(seatOf))
    for (const m of members.value) { if (m.uid in seatOf) continue; const f = freeSeat(used); if (f) { seatOf[m.uid] = f.id; used.add(f.id) } }
    saveLayout(); saveSeats()
}
function seatDown(id: number, e: PointerEvent) { e.preventDefault(); dragSeat.value = id; scene.value?.setPointerCapture(e.pointerId) }

/* ── перетаскивание участников ── */
const scene = ref<HTMLElement | null>(null)
const dragUid = ref<number | null>(null)
const dragPos = reactive({ x: 0, y: 0 })
let moved = false
function toPct(e: PointerEvent) {
    const r = scene.value!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(m: Member, e: PointerEvent) {
    if (editing.value) return // в режиме правки мест участников не таскаем
    e.preventDefault()
    dragUid.value = m.uid; moved = false
    const p = toPct(e); dragPos.x = p.x; dragPos.y = p.y
    scene.value?.setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
    if (dragUid.value != null) {
        const p = toPct(e); dragPos.x = p.x; dragPos.y = p.y; moved = true; active.value = null
    } else if (dragSeat.value != null) {
        const s = seats.find(x => x.id === dragSeat.value); if (!s) return
        const p = toPct(e); s.x = Math.max(5, Math.min(95, p.x)); s.y = Math.max(8, Math.min(92, p.y))
    }
}
function up() {
    if (dragUid.value != null) {
        const uid = dragUid.value
        if (moved) {
            let best = seats[0], bd = Infinity
            for (const s of seats) { const d = (s.x - dragPos.x) ** 2 + (s.y - dragPos.y) ** 2; if (d < bd) { bd = d; best = s } }
            if (best) {
                const occ = Object.keys(seatOf).map(Number).find(u => u !== uid && seatOf[u] === best!.id)
                if (occ != null) seatOf[occ] = seatOf[uid]!
                seatOf[uid] = best.id; saveSeats()
            }
        } else { active.value = active.value === uid ? null : uid }
        dragUid.value = null
        return
    }
    if (dragSeat.value != null) { dragSeat.value = null; saveLayout() }
}

/* ── позиции / меню ── */
function pos(m: Member) {
    if (dragUid.value === m.uid) return { left: dragPos.x + '%', top: dragPos.y + '%' }
    const s = seats.find(x => x.id === seatOf[m.uid]) || seats[0]
    return s ? { left: s.x + '%', top: s.y + '%' } : { left: '50%', top: '50%' }
}
const active = ref<number | null>(null)
const canHover = import.meta.client && window.matchMedia?.('(hover:hover)').matches
let hideT: any = null
function enter(m: Member) {
    if (!canHover || dragUid.value != null || editing.value) return
    clearTimeout(hideT); active.value = m.uid
}
function leaveSoon() {
    if (!canHover) return
    clearTimeout(hideT); hideT = setTimeout(() => { active.value = null }, 220)
}
function keepOpen() { clearTimeout(hideT) } // навели на само окошко — не закрывать
const activeMember = computed(() => members.value.find(m => m.uid === active.value) || null)

function initials(n: string) { return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }
function giveTask(m: Member) { toast(`Задача для ${m.name} — модуль задач скоро ✦`); active.value = null }

if (import.meta.client) window.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest?.('.pawn, .opop')) active.value = null
})
</script>

<template>
    <section class="office">
        <div ref="scene" class="office__scene" @pointermove="move" @pointerup="up" @pointercancel="up">
            <!-- фон-картинка офиса (по размеру студии); нет файла в public/office/ → остаётся CSS-сцена -->
            <img v-show="imgOk" class="office__img" :src="officeImg" alt="" @load="imgOk = true" @error="imgOk = false">
            <template v-if="!imgOk">
                <div class="office__floor" />
                <div v-for="(s, i) in seats" :key="i" class="desk" :style="{ left: s.x + '%', top: s.y + '%' }">
                    <div class="desk__top"><span class="desk__mon" /></div>
                </div>
            </template>
            <div class="office__glow" />

            <!-- редактор рабочих мест -->
            <button class="office__edit" @click="editing = !editing">
                <span class="material-icons">{{ editing ? 'check' : 'edit_location_alt' }}</span>{{ editing ? 'Готово' : 'Места' }}
            </button>
            <template v-if="editing">
                <div v-for="s in seats" :key="'sq' + s.id" class="seatsq" :class="{ drag: dragSeat === s.id }"
                    :style="{ left: s.x + '%', top: s.y + '%' }" @pointerdown="seatDown(s.id, $event)">
                    <button class="seatsq__x" @pointerdown.stop @click.stop="removeSeat(s.id)">×</button>
                </div>
                <button class="office__addseat" @click="addSeat"><span class="material-icons">add</span> Место</button>
            </template>

            <!-- участники -->
            <div v-for="m in members" :key="m.uid" class="pawn" :class="{ drag: dragUid === m.uid, owner: m.owner }"
                :style="pos(m)" @pointerdown="down(m, $event)" @mouseenter="enter(m)" @mouseleave="leaveSoon">
                <span class="pawn__ava" :style="m.avatar ? { backgroundImage: `url('${m.avatar}')` } : undefined">
                    <template v-if="!m.avatar">{{ initials(m.name) }}</template>
                </span>
                <span v-if="m.owner" class="pawn__crown">★</span>
            </div>

            <!-- окошко действий -->
            <div v-if="activeMember" class="opop" :style="pos(activeMember)" @mouseenter="keepOpen"
                @mouseleave="leaveSoon">
                <div class="opop__head">
                    <span class="opop__ava" :style="activeMember.avatar ? { backgroundImage: `url('${activeMember.avatar}')` } : undefined">
                        <template v-if="!activeMember.avatar">{{ initials(activeMember.name) }}</template>
                    </span>
                    <div>
                        <div class="opop__name">{{ activeMember.name }}</div>
                        <div class="opop__role">{{ activeMember.role }}</div>
                    </div>
                </div>
                <div v-if="activeMember.working" class="opop__work">
                    <span class="material-icons">sports_esports</span>
                    <span>Работает над <b>{{ activeMember.working }}</b></span>
                </div>
                <div class="opop__acts">
                    <button class="opop__btn" @click="giveTask(activeMember)">
                        <span class="material-icons">assignment_add</span>Дать задачу
                    </button>
                    <NuxtLink v-if="activeMember.username" :to="localePath(`/u/${activeMember.username}`)" class="opop__btn">
                        <span class="material-icons">person</span>Профиль
                    </NuxtLink>
                    <NuxtLink :to="localePath('/chats')" class="opop__btn">
                        <span class="material-icons">chat</span>Написать
                    </NuxtLink>
                </div>
            </div>

            <div class="office__status">
                <span class="office__dot" />
                <div>
                    <div class="office__title">Офис студии · {{ members.length }} в сети</div>
                    <div class="office__sub">Перетащите участника на другое место · наведите для действий</div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.office { position: relative; }
.office__scene {
    position: relative; aspect-ratio: 16 / 10; border-radius: 20px; overflow: hidden;
    border: 1px solid rgba(195, 33, 120, .25); touch-action: none;
    user-select: none; -webkit-user-select: none;
    background: radial-gradient(ellipse at 50% 25%, #34104a 0%, #1d0726 55%, #0e0413 100%);
    box-shadow: 0 14px 40px -10px rgba(0, 0, 0, .6), 0 1px 0 rgba(255, 255, 255, .05) inset;
}
.office__floor {
    position: absolute; inset: -20% 0 0; opacity: .5;
    background-image: linear-gradient(rgba(195, 33, 120, .16) 1px, transparent 1px), linear-gradient(90deg, rgba(195, 33, 120, .16) 1px, transparent 1px);
    background-size: 46px 46px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 55%, #000 35%, transparent 82%);
    mask-image: radial-gradient(ellipse at 50% 55%, #000 35%, transparent 82%);
    transform: perspective(700px) rotateX(55deg) scale(1.5); transform-origin: 50% 45%;
}
.office__glow { position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%); width: 340px; height: 240px; background: var(--p); filter: blur(120px); opacity: .22; pointer-events: none; }
.office__img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }

/* редактор мест */
.office__edit { position: absolute; top: 12px; right: 12px; z-index: 25; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid var(--border); border-radius: 10px; background: rgba(10, 2, 16, .7); backdrop-filter: blur(8px); color: var(--text-2); font-size: 12.5px; }
.office__edit:hover { border-color: var(--p); color: #fff; }
.office__edit .material-icons { font-size: 16px; }
.office__addseat { position: absolute; top: 54px; right: 12px; z-index: 25; display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px dashed var(--p); border-radius: 10px; background: rgba(195, 33, 120, .14); color: var(--p); font-size: 12.5px; }
.office__addseat .material-icons { font-size: 16px; }
.seatsq { position: absolute; z-index: 15; transform: translate(-50%, -50%); width: 32px; height: 32px; border: 2px dashed var(--p); border-radius: 8px; background: rgba(195, 33, 120, .16); cursor: grab; touch-action: none; }
.seatsq.drag { cursor: grabbing; background: rgba(195, 33, 120, .32); }
.seatsq__x { position: absolute; top: -9px; right: -9px; width: 18px; height: 18px; display: grid; place-items: center; border: none; border-radius: 50%; background: var(--err); color: #fff; font-size: 13px; line-height: 1; cursor: pointer; }

/* стол */
.desk {
    position: absolute; transform: translate(-50%, -50%); width: 62px; height: 40px;
    border-radius: 8px; background: linear-gradient(180deg, rgba(255, 255, 255, .1), rgba(255, 255, 255, .04));
    border: 1px solid rgba(255, 255, 255, .1); box-shadow: 0 10px 20px rgba(0, 0, 0, .4);
    display: grid; place-items: center; pointer-events: none;
}
.desk__mon { width: 26px; height: 14px; border-radius: 3px; background: linear-gradient(135deg, #2a1240, #6f3f8f); box-shadow: 0 0 10px rgba(195, 33, 120, .5); display: block; }

/* участник-пешка */
.pawn {
    position: absolute; transform: translate(-50%, -84%); z-index: 5; cursor: grab; touch-action: none;
    transition: left .18s ease, top .18s ease;
}
.pawn.drag { transition: none; cursor: grabbing; z-index: 20; }
.pawn__ava {
    display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
    background: var(--surf-2) center / cover no-repeat; color: #fff; font-family: var(--f-mono); font-weight: 600; font-size: 13px;
    border: 2px solid var(--p); box-shadow: 0 8px 20px rgba(0, 0, 0, .55), 0 0 0 4px rgba(195, 33, 120, .15); overflow: hidden;
}
.pawn.owner .pawn__ava { border-color: var(--warn); box-shadow: 0 8px 20px rgba(0, 0, 0, .55), 0 0 14px rgba(253, 203, 110, .5); }
.pawn:hover .pawn__ava { transform: scale(1.06); }
.pawn__crown { position: absolute; top: -8px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--warn); }

/* окошко */
.opop {
    position: absolute; z-index: 30; width: 214px;
    /* поднимаем ВЫШЕ аватарки, чтобы окошко её не перекрывало и не мешало тянуть */
    transform: translate(-50%, calc(-100% - 48px));
    padding: 12px; background: var(--surf-2); border: 1px solid var(--border); border-radius: 14px;
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, .65);
}
.opop__work { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 8px 10px; background: var(--bg); border-radius: 9px; font-size: 12px; color: var(--text-2); }
.opop__work .material-icons { font-size: 15px; color: var(--p); flex: none; }
.opop__work b { color: var(--text); }
.opop__head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.opop__ava { display: grid; place-items: center; width: 38px; height: 38px; flex: none; border-radius: 50%; background: var(--p) center / cover; color: #fff; font-family: var(--f-mono); font-size: 13px; overflow: hidden; }
.opop__name { font-size: 14px; font-weight: 600; }
.opop__role { font-family: var(--f-mono); font-size: 10.5px; color: var(--text-2); }
.opop__acts { display: flex; flex-direction: column; gap: 4px; }
.opop__btn { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: none; background: none; border-radius: 9px; color: var(--text); font-size: 13px; text-align: left; }
.opop__btn:hover { background: rgba(255, 255, 255, .06); color: var(--p); }
.opop__btn .material-icons { font-size: 17px; }

.office__status {
    position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; align-items: center; gap: 11px;
    padding: 9px 18px; border: 1px solid var(--border); border-radius: 13px; background: rgba(10, 2, 16, .8); backdrop-filter: blur(10px);
    white-space: nowrap; max-width: calc(100% - 24px);
}
.office__dot { width: 9px; height: 9px; flex: none; border-radius: 50%; background: var(--ok); box-shadow: 0 0 12px var(--ok); }
.office__title { font-family: var(--f-display); font-weight: 700; font-size: 14px; }
.office__sub { font-size: 10.5px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; }
</style>
