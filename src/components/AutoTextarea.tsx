import { useEffect, useRef } from 'react'

export function AutoTextarea({ value, style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const prevWidth = useRef<number>(0)

  function resize() {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }

  useEffect(() => { resize() }, [value, style?.fontSize])  

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width !== prevWidth.current) {
        prevWidth.current = width
        resize()
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <textarea spellCheck="false" ref={ref} value={value} style={{ ...style, overflow: 'hidden' }} rows={1} {...props} />
}
