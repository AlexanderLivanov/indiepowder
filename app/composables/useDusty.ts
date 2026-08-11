/** Глобальное состояние помощника Дасти — открыть из хедера/любого места. */
export function useDusty() {
  const open = useState('dusty:open', () => false)
  return {
    open,
    show: () => { open.value = true },
    hide: () => { open.value = false },
    toggle: () => { open.value = !open.value },
  }
}
