import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { secureStorage } from '../utils/secureStorage'

// Типизируем нашего пользователя (соответствует тому, что отдает бэкенд)
export interface User {
    id: string
    deviceId: string
    role: string
}

// Типизируем состояние стора
interface AuthState {
    token: string | null
    user: User | null
    isHydrated: boolean
    setAuth: (token: string, user: User) => void
    logout: () => void
    setHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        set => ({
            token: null,
            user: null,
            isHydrated: false, // Флаг окончания загрузки стора из памяти

            setAuth: (token, user) => set({ token, user }),

            logout: () => set({ token: null, user: null }),

            setHydrated: state => set({ isHydrated: state }),
        }),
        {
            name: 'tarot-auth-secure', // Ключ шифрования в Keychain/Keystore
            // Передаем наш безопасный адаптер!
            storage: createJSONStorage(() => secureStorage),
            onRehydrateStorage: () => state => {
                if (state) {
                    state.setHydrated(true) // Сообщаем UI, что стор готов
                }
            },
        },
    ),
)
