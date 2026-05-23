type Props = {
  searchQuery: string
  onSearchChange: (q: string) => void
  hasExpanded: boolean
  onCollapseAll: () => void
}

export function SearchToolbar({ searchQuery, onSearchChange, hasExpanded, onCollapseAll }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a2e] shrink-0">
      <input
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search…"
        className="flex-1 min-w-0 bg-transparent text-xs text-[#c8c8d8] placeholder-[#444] outline-none"
      />
      <button
        onClick={onCollapseAll}
        disabled={!hasExpanded}
        title="Collapse all"
        className="text-xs text-[#555] enabled:hover:text-[#888] disabled:opacity-30 transition-colors shrink-0"
      >
        /
      </button>
    </div>
  )
}
