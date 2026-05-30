import type { Character, CharacterGroup } from './character'
import type { Act } from './act'
import type { Scene } from './scene'
import type { Sketch } from './sketch'
import type { ProjectSettings } from './settings'
import type { TimelineEvent } from '../components/panels/right-panel/D3Timeline'

export type Genre = 'FEATURE' | 'SHORT' | 'TV PILOT' | 'MINI-SERIES'

export type Project = {
  id: string
  title: string
  genre: Genre
  draftNumber: number
  lastEditedAt: string
  createdAt: string
  synopsis?: string
  characters: Character[]
  acts: Act[]
  scenes: Scene[]
  sketches: Sketch[]
  settings: ProjectSettings
  characterGroups?: CharacterGroup[]
  characterRelationships?: { id: string; fromId: string; toId: string; label: string; description: string }[]
  timelineEvents?: TimelineEvent[]
}

export const defaultSettings: ProjectSettings = {
  activePanel: 'synopsis',
  fontSizes: {
    scenes: 'lg',
    synopsis: 'lg',
    characters: 'lg',
    acts: 'lg',
  },
}
