import { apiClient } from './api.client'
import { CardInputDto, InterpretReadingDto } from '../types/dto'

export const TarotApi = {
    // 1. Инициализация анонимного пользователя
    initAnonymous: async (deviceId: string) => {
        const response = await apiClient.post('/auth/init-anonymous', { deviceId })
        return response.data // { accessToken, user }
    },

    // 2. Проверка лимитов
    checkStatus: async () => {
        const response = await apiClient.get('/tarot/status')
        return response.data // { canReadFree, timeUntilNextFree }
    },

    // 3. Отправка карт на интерпретацию к ИИ
    interpretReading: async (dto: InterpretReadingDto) => {
        const response = await apiClient.post('/tarot/interpret', dto)
        return response.data // { cards, aiResponse }
    },

    // 4. Получение истории
    getHistory: async () => {
        const response = await apiClient.get('/history')
        return response.data // HistoryReadingItem[]
    },
}
