import { useState } from 'react'
import { useResize } from '../hooks/useResize'
import { SketchesPanel } from './panels/right-panel/SketchesPanel'
import { OutlinerPanel } from './panels/right-panel/OutlinerPanel'
import { AstroChartPanel } from './panels/right-panel/AstroChartPanel'
import type { Project } from '../types/project'

type Tab = 'sketches' | 'outliner' | 'astrochart'

const TABS: { key: Tab; label: string }[] = [
  { key: 'sketches',   label: 'Sketches' },
  { key: 'outliner',   label: 'Outliner' },
  { key: 'astrochart', label: 'AstroChart' },
]

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function RightPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const { width, dragHandleProps } = useResize(360, 200, 1300, 'left', 200)
  const [activeTab, setActiveTab] = useState<Tab>('sketches')

  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden border-l border-[#1a1a2e]"
      style={{ width }}
    >
      <div {...dragHandleProps} />
      <div className="flex border-b border-[#1a1a2e] shrink-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-xs tracking-wide transition-colors border-b-2 -mb-px ${activeTab === key
              ? 'border-b-[#c9a227] text-[#c9a227]'
              : 'border-b-transparent text-[#555] hover:text-[#888]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'sketches' && (
        <SketchesPanel
          project={project}
          onUpdate={onUpdate}
          selectedId={selectedId}
          onSelectId={onSelectId}
        />
      )}
      {activeTab === 'outliner' && <OutlinerPanel />}
      {activeTab === 'astrochart' && <AstroChartPanel />}
    </div>
  )
}
