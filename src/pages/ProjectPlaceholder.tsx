import { useParams, useNavigate } from 'react-router-dom'

export function ProjectPlaceholder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <p className="text-[#c9a227] font-bold tracking-widest text-sm">SCREENWRITER</p>
      <p className="text-[#888] text-sm">Editor coming soon — project {id}</p>
      <button
        onClick={() => navigate('/')}
        className="text-[#555] text-xs hover:text-[#888] transition-colors mt-2"
      >
        ← Back to projects
      </button>
    </div>
  )
}
