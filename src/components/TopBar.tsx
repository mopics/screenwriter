type TopBarProps = {
  onNewProject: () => void
}

export function TopBar({ onNewProject }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#08080f] border-b border-[#c9a227]/20 px-6 py-4 flex items-center justify-between">
      <span className="text-[#c9a227] font-bold tracking-[0.2em] text-sm">SCREENWRITER</span>
      <button
        onClick={onNewProject}
        className="bg-[#c9a227] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#d4aa30] transition-colors"
      >
        + New Project
      </button>
    </header>
  )
}
