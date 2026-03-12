import { apiClient } from './api.client';

export const authApi = {
    syncAccounts: async (
        oldAnonymousToken: string,
    ): Promise<{ success: boolean }> => {
        const response = await apiClient.post('/auth/sync', {
            oldAnonymousToken,
        });
        return response.data;
    },
};
