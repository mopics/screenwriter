export type DialogueLine = {
  character: string
  parenthetical?: string
  line: string
}

export type SceneBlock =
  | { type: 'action'; text: string }
  | { type: 'dialogue'; data: DialogueLine }

export type Scene = {
  id: string
  slugLine: string
  actId: string
  order: number
  blocks: SceneBlock[]
}
