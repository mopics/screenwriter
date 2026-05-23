import type { Character, CharacterGroup } from './character'
import type { Act } from './act'
import type { Scene } from './scene'
import type { Sketch } from './sketch'
import type { ProjectSettings } from './settings'

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
  characterRelationships?: { fromId: string, toId: string, description: string }[]
}
