export type Character = {
    id: string
    name: string
    pronouns: string[],
    groups: string[],
    otherNames: string[],
    personality: string,
    physicalDescription: string,
    motivation: string,
    internalConflict: string,
    strengths: string,
    weaknesses: string,
    characterArc: string,
    dialogueStyle: string,
    backstory: string,
    relationships: string[],
    expandedFields: string[]
}

export type CharacterGroup = {
    id: string
    name: string
    characterIds: string[]
}