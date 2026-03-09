// Оставляем константы, они полезны на клиенте для списков или проверок
export const LAYOUT_TYPES = ['chronological', 'reflective', 'partner', 'daily'] as const

export type LayoutType = (typeof LAYOUT_TYPES)[number]

export const DRAW_SOURCES = ['app', 'physical'] as const
export type DrawSource = (typeof DRAW_SOURCES)[number]

// Превращаем класс с декораторами в чистый интерфейс
export interface CardInputDto {
    id: string
    name: string
    position: string
    isReversed: boolean
}

// То же самое для главного DTO запроса
export interface InterpretReadingDto {
    question: string
    layoutType: LayoutType
    drawSource: DrawSource
    isAd?: boolean
    cards: CardInputDto[]
}
