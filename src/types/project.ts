export type Genre = 'FEATURE' | 'SHORT' | 'TV PILOT' | 'MINI-SERIES'

export type Project = {
  id: string
  title: string
  genre: Genre
  draftNumber: number
  lastEditedAt: string
  createdAt: string
}
