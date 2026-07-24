/**
 * Голографический наклон карточки за курсором.
 * Портировано 1:1 из Dustore (explore.php): угол 12°, perspective 800px,
 * подъём на 8px, scale 1.02 и смещение блика через --dx.
 */
export function useTilt(
  opts: { max?: number; lift?: number; scale?: number } = {},
) {
  const { max = 12, lift = 8, scale = 1.02 } = opts;

  const rx = ref(0);
  const ry = ref(0);
  const dx = ref(0);
  const active = ref(false);
  const resetting = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // на тач-экранах наклон не нужен — там нет курсора
  function pointerFine() {
    return import.meta.client && window.matchMedia("(hover: hover)").matches;
  }

  function move(e: MouseEvent) {
    if (!pointerFine()) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();

    // nx, ny — координаты курсора в диапазоне -1…1 от центра карточки
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;

    ry.value = max * nx;
    rx.value = -max * ny;
    dx.value = nx * 50; // блик едет за курсором
    active.value = true;
    resetting.value = false;
  }

  function leave() {
    active.value = false;
    resetting.value = true;
    rx.value = 0;
    ry.value = 0;
    dx.value = 0;
    clearTimeout(timer);
    timer = setTimeout(() => {
      resetting.value = false;
    }, 400);
  }

  onUnmounted(() => clearTimeout(timer));

  const style = computed(() => ({
    "--dx": `${dx.value}%`,
    transform: active.value
      ? `perspective(800px) rotateX(${rx.value}deg) rotateY(${ry.value}deg) translateY(-${lift}px) scale(${scale})`
      : "",
    // за курсором — мгновенно, обратно — плавно
    transition: resetting.value
      ? "transform .4s cubic-bezier(.2,.7,.2,1)"
      : "transform .01s ease-out",
  }));

  return { style, move, leave, active };
}
