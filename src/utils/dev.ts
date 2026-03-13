import { User } from '../store/useAuthStore'

export const isMockAuthEnabled =
    process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true'

export const createMockUser = (
    provider: User['authProvider'],
    deviceId: string,
    email?: string,
): User => ({
    id: `mock-${provider}-${deviceId}`,
    deviceId,
    role: provider === 'anonymous' ? 'anonymous' : 'user',
    email: email ?? null,
    authProvider: provider,
})

export const createMockToken = (provider: string) => `mock-token-${provider}`
