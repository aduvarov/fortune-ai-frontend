import { CardInputDto, DrawSource, LayoutType } from './dto'

// Описываем все экраны и параметры, которые они принимают
export type RootStackParamList = {
    Splash: undefined // <-- Добавили Splash
    Home: undefined // undefined значит, что экран не требует параметров при открытии
    History: undefined
    Settings: undefined
    SetupReading: { initialLayout?: LayoutType } | undefined

    // На стол мы передаем тип расклада (daily, chronological и т.д.)
    VirtualTable: { layoutType: LayoutType; question?: string }
    PhysicalInput: { layoutType: LayoutType; question?: string }

    // На экран результата мы передаем готовые карты, чтобы ИИ их расшифровал
    // Временно используем any, пока не перенесем интерфейс CardInputDto на фронт
    Result: {
        cards: CardInputDto[]
        layoutType: LayoutType
        drawSource: DrawSource
        question?: string // <-- И сюда
    }
    Auth: undefined
    DesignPlayground: undefined
}
