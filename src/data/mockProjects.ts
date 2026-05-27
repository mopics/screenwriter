import type { Project } from '../types/project'

export const mockProjects: Project[] = [
        {
                id: '2',
                title: 'Homecoming',
                genre: 'SHORT',
                draftNumber: 1,
                lastEditedAt: '2026-05-11T10:00:00Z',
                createdAt: '2026-04-15T10:00:00Z',
                characters: [],
                acts: [],
                scenes: [],
                sketches: [],
                settings: {
                        activePanel: 'synopsis',
                        fontSizes: {
                                scenes: 'lg',
                                synopsis: 'lg',
                                characters: 'lg',
                                acts: 'lg',
                        },
                }
        },
]
