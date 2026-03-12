import { apiClient } from './api.client';
import { User } from '../store/useAuthStore';

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export const authApi = {
    syncAccounts: async (oldAnonymousToken: string): Promise<{ success: boolean }> => {
        const response = await apiClient.post('/auth/sync', { oldAnonymousToken });
        return response.data;
    },
};
