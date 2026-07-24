export interface Toast {
  id: number
  text: string
  kind: 'ok' | 'info' | 'err'
}

/** Общие всплывающие уведомления. useState — один список на всё приложение. */
export function useToast() {
  const list = useState<Toast[]>('toasts', () => [])
  let seq = 0

  function push(text: string, kind: Toast['kind'] = 'info') {
    const id = ++seq + Date.now()
    list.value.push({ id, text, kind })
    setTimeout(() => {
      list.value = list.value.filter(t => t.id !== id)
    }, 3200)
  }

  return {
    list,
    toast: push,
    ok: (t: string) => push(t, 'ok'),
    err: (t: string) => push(t, 'err'),
  }
}