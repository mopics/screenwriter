import { useState } from 'react'
import type { Project, Genre } from '../types/project'

const GENRES: Genre[] = ['FEATURE', 'SHORT', 'TV PILOT', 'MINI-SERIES']

type NewProjectModalProps = {
  onClose: () => void
  onCreate: (project: Project) => void
}

export function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState<Genre>('FEATURE')

  function handleSubmit() {
    if (!title.trim()) return
    const now = new Date().toISOString()
    onCreate({
      id: crypto.randomUUID(),
      title: title.trim(),
      genre,
      draftNumber: 1,
      lastEditedAt: now,
      createdAt: now,
    })
  }

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div
        className="bg-[#0d0d14] border-t-2 border-t-[#c9a227] border border-[#1a1a2e] rounded-lg p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-[#f0f0f0] font-bold text-lg mb-5">New Project</h2>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Untitled Script"
          className="w-full bg-[#08080f] border border-[#2a2a3a] rounded px-3 py-2 text-[#f0f0f0] placeholder-[#444] text-sm mb-4 outline-none focus:border-[#c9a227]/50"
        />
        <div className="flex flex-wrap gap-2 mb-6">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-3 py-1 rounded text-xs font-bold tracking-wider transition-colors ${
                genre === g
                  ? 'bg-[#c9a227] text-black'
                  : 'bg-[#12121e] text-[#888] hover:text-[#c9a227]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="text-[#666] text-sm hover:text-[#888] transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-[#c9a227] text-black text-sm font-bold px-4 py-2 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d4aa30] transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
