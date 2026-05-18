import type { Character } from './character'
import type { Act } from './act'
import type { Scene } from './scene'
import type { Sketch } from './sketch'

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
}
