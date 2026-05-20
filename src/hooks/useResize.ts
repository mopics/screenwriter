import { useState, useCallback, useRef, useEffect } from 'react'

export function useResize(
  initialWidth: number,
  min = 120,
  max = 480,
  direction: 'right' | 'left' = 'right',
  fadeArea = 100,
) {
  const [width, setWidth] = useState(initialWidth)
  const handleRef = useRef<HTMLDivElement>(null)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      const newWidth = direction === 'left'
        ? Math.max(min, Math.min(max, startWidth - delta))
        : Math.max(min, Math.min(max, startWidth + delta))
      setWidth(newWidth)
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [width, min, max, direction])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!handleRef.current) return
      const rect = handleRef.current.getBoundingClientRect()
      const handleX = direction === 'left' ? rect.left : rect.right
      const dist = Math.abs(e.clientX - handleX)
      const opacity = Math.max(0, Math.min(1, (fadeArea - dist) / (fadeArea - 10)))
      handleRef.current.style.opacity = String(opacity)
    }
    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [direction, fadeArea])

  const dragHandleProps = {
    ref: handleRef,
    onMouseDown: startResize,
    className: `absolute ${direction === 'left' ? 'left-0' : 'right-0'} top-0 h-full w-1 z-10 cursor-col-resize bg-[#555] hover:bg-[#a98207] transition-colors`,
    style: { opacity: 0 },
  }

  return { width, dragHandleProps }
}
