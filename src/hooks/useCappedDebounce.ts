import { useRef, useCallback, useEffect } from 'react'

// Debounces fn by delay ms, but guarantees a call within cap ms even if the
// user keeps typing without pausing. Flushes any pending call on unmount.
export function useCappedDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300,
  cap = 2000,
): T {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestArgs = useRef<Parameters<T> | null>(null)

  const flush = useCallback(() => {
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null }
    if (capTimer.current) { clearTimeout(capTimer.current); capTimer.current = null }
    if (latestArgs.current !== null) {
      fnRef.current(...latestArgs.current)
      latestArgs.current = null
    }
  }, [])

  useEffect(() => flush, [flush])

  return useCallback((...args: Parameters<T>) => {
    latestArgs.current = args
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(flush, delay)
    if (!capTimer.current) {
      capTimer.current = setTimeout(flush, cap)
    }
  }, [delay, cap, flush]) as T
}
