import { useResize } from '../hooks/useResize'
import type { SectionKey } from '../types/settings';

type SectionItem = { key: SectionKey; icon: string; label: string }

const SECTIONS: SectionItem[] = [
  { key: 'synopsis', icon: '📋', label: 'Synopsis' },
  { key: 'characters', icon: '🎭', label: 'Characters' },
  { key: 'characterRelations', icon: '🕸️', label: 'Relations' },
  { key: 'acts', icon: '🗂️', label: 'Acts' },
  { key: 'scenes', icon: '🎬', label: 'Scenes' },
]

type Props = {
  activeSection: SectionKey
  onSectionChange: (s: SectionKey) => void
}

export function SidePanel({ activeSection, onSectionChange }: Props) {
  const { width, dragHandleProps } = useResize(80, 48, 240)

  return (
    <nav className="relative flex flex-col shrink-0 bg-panel border-r border-[#1a1a2e]" style={{ width }}>
      {SECTIONS.map(({ key, icon, label }) => {
        const isActive = key === activeSection
        return (
          <button
            key={key}
            title={label}
            onClick={() => onSectionChange(key)}
            className={`flex items-center justify-center h-14 w-full text-xl border-l-2 transition-colors ${isActive
              ? 'border-l-[#c9a227] bg-panelSelect text-[#c9a227]'
              : 'border-l-transparent text-[#555] hover:text-[#888] hover:bg-panelHover'
              }`}
          >
            {icon}
          </button>
        )
      })}
      <div {...dragHandleProps} />
    </nav>
  )
}
