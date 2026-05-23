export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes'
export const fontSizeMap = { sm: '12px', lg: '16px', xl: '20px', '2xl': '24px' } as const
export type FontSize = keyof typeof fontSizeMap;
export interface FontSizeSettings {
    scenes: FontSize
    synopsis: FontSize
    characters: FontSize
    acts: FontSize
}

export type ProjectSettings = {
    activePanel: SectionKey,
    fontSizes: FontSizeSettings
}