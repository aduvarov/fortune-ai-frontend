import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { secureStorage } from '../utils/secureStorage'
import { supabase } from '../utils/supabase'

// Типизируем нашего пользователя (соответствует тому, что отдает бэкенд)
export interface User {
    id: string
    deviceId: string
    role: string
    email?: string | null
    authProvider?: 'anonymous' | 'email' | 'google'
}

// Типизируем состояние стора
interface AuthState {
    token: string | null
    user: User | null
    energyBalance: number | null
    isHydrated: boolean
    setAuth: (token: string, user: User) => void
    setEnergyBalance: (balance: number | null) => void
    logout: () => void
    setHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        set => ({
            token: null,
            user: null,
            energyBalance: null,
            isHydrated: false, // Флаг окончания загрузки стора из памяти

            setAuth: (token, user) => set({ token, user }),

            setEnergyBalance: balance => set({ energyBalance: balance }),

            logout: () => {
                // Полный сброс. Новый deviceId будет создан при следующем запуске (SplashScreen)
                supabase.auth.signOut();
                set({ token: null, user: null, energyBalance: null })
            },

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
