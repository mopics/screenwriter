import { useEffect, useRef, useState, useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({ breaks: true })

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableMarkdownToggle?: boolean
}

export function AutoTextarea({ value, style, enableMarkdownToggle, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const prevWidth = useRef<number>(0)
  const [showMarkdown, setShowMarkdown] = useState(true)

  function resize() {
    if (!ref.current) return
    let scrollParent: HTMLElement | null = ref.current.parentElement
    while (scrollParent) {
      const { overflowY } = getComputedStyle(scrollParent)
      if (overflowY === 'auto' || overflowY === 'scroll') break
      scrollParent = scrollParent.parentElement
    }
    const savedScrollTop = scrollParent?.scrollTop ?? 0
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
    if (scrollParent) scrollParent.scrollTop = savedScrollTop
  }

  useEffect(() => { resize() }, [value, style?.fontSize, showMarkdown])

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

  const renderedHtml = useMemo(
    () => enableMarkdownToggle && showMarkdown ? DOMPurify.sanitize(md.render(String(value ?? ''))) : null,
    [enableMarkdownToggle, showMarkdown, value]
  )

  if (!enableMarkdownToggle) {
    return <textarea spellCheck="false" ref={ref} value={value} style={{ ...style, overflow: 'hidden' }} rows={1} {...props} />
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMarkdown(v => !v)}
        title={showMarkdown ? 'Edit' : 'Preview'}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 1,
          padding: '1px 5px',
          fontSize: '10px',
          lineHeight: '14px',
          background: showMarkdown ? '#2a6' : '#444',
          color: '#fff',
          border: 'none',
          borderRadius: 3,
          cursor: 'pointer',
          opacity: 0.7,
        }}
      >
        {showMarkdown ? 'Edit' : 'MD'}
      </button>

      {showMarkdown ? (
        <div
          className="markdown-preview"
          style={{ ...style, color: 'var(--color-text-input)', padding: '8px 12px', paddingRight: 36, minHeight: '1em' }}
          dangerouslySetInnerHTML={{ __html: renderedHtml! }}
        />
      ) : (
        <textarea
          spellCheck="false"
          ref={ref}
          value={value}
          style={{ ...style, overflow: 'hidden', paddingRight: 36 }}
          rows={1}
          {...props}
        />
      )}
    </div>
  )
}
