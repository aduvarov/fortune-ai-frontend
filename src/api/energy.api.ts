import { apiClient } from './api.client'
import {
    EnergyBalanceResponse,
    EnergyPackagesResponse,
    PurchaseEnergyDto,
} from '../types/energy'

export const EnergyApi = {
    getBalance: async (): Promise<EnergyBalanceResponse> => {
        const response = await apiClient.get('/energy/balance')
        return response.data
    },

    getPackages: async (): Promise<EnergyPackagesResponse> => {
        const response = await apiClient.get('/energy/packages')
        return response.data
    },

    rewardAd: async (): Promise<EnergyBalanceResponse> => {
        const response = await apiClient.post('/energy/reward-ad')
        return response.data
    },

    purchasePackage: async (dto: PurchaseEnergyDto): Promise<EnergyBalanceResponse> => {
        const response = await apiClient.post('/energy/purchase', dto)
        return response.data
    },
}
