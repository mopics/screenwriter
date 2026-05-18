export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes' | 'sketches'

type SectionItem = { key: SectionKey; icon: string; label: string }

const SECTIONS: SectionItem[] = [
  { key: 'synopsis', icon: '📋', label: 'Synopsis' },
  { key: 'characters', icon: '👤', label: 'Characters' },
  { key: 'acts', icon: '🎭', label: 'Acts' },
  { key: 'scenes', icon: '🎬', label: 'Scenes' },
  { key: 'sketches', icon: '✏️', label: 'Sketches' },
]

type Props = {
  activeSection: SectionKey
  onSectionChange: (s: SectionKey) => void
}

export function SidePanel({ activeSection, onSectionChange }: Props) {
  return (
    <nav className="w-12 flex flex-col bg-[#0d0d18] border-r border-[#1a1a2e]">
      {SECTIONS.map(({ key, icon, label }) => {
        const isActive = key === activeSection
        return (
          <button
            key={key}
            title={label}
            onClick={() => onSectionChange(key)}
            className={`flex items-center justify-center h-12 w-full text-lg border-l-2 transition-colors ${
              isActive
                ? 'border-l-[#c9a227] bg-[#14141f] text-[#c9a227]'
                : 'border-l-transparent text-[#555] hover:text-[#888] hover:bg-[#0f0f1a]'
            }`}
          >
            {icon}
          </button>
        )
      })}
    </nav>
  )
}
