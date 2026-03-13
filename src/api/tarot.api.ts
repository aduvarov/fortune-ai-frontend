import { apiClient } from './api.client'
import { CardInputDto, InterpretReadingDto } from '../types/dto'

export const TarotApi = {
    initAnonymous: async (deviceId: string) => {
        const response = await apiClient.post('/auth/init-anonymous', { deviceId })
        return response.data
    },

    interpretReading: async (dto: InterpretReadingDto) => {
        const response = await apiClient.post('/tarot/interpret', dto)
        return response.data
    },

    getHistory: async (page: number = 1, limit: number = 10) => {
        const response = await apiClient.get(`/history?page=${page}&limit=${limit}`)
        return response.data
    },

    deleteHistoryItem: async (id: string) => {
        const response = await apiClient.delete(`/history/${id}`)
        return response.data
    },
}
