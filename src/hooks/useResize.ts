import { useState, useCallback } from 'react'

export function useResize(
  initialWidth: number,
  min = 120,
  max = 480,
  direction: 'right' | 'left' = 'right',
) {
  const [width, setWidth] = useState(initialWidth)

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

  const dragHandleProps = {
    onMouseDown: startResize,
    className: direction === 'left'
      ? 'absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#c9a227]/30 transition-colors'
      : 'absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#c9a227]/30 transition-colors',
  } as const

  return { width, dragHandleProps }
}
