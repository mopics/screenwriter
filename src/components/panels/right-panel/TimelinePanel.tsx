import { D3Timeline } from './D3Timeline'

export function TimelinePanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <D3Timeline futureCutoff={2100} />
    </div>
  )
}
