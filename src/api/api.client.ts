import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import Constants from 'expo-constants' // Для получения deviceId позже

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://devlab.kz:3333'

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Перехватчик запросов (добавляет токен)
apiClient.interceptors.request.use(
    config => {
        const token = useAuthStore.getState().token
        // Если токен есть в сторе, добавляем его, ТОЛЬКО ЕСЛИ его еще не передали явно
        if (token && config.headers && !config.headers.Authorization) {
            config.headers.set('Authorization', `Bearer ${token}`)
        }
        return config
    },
    error => Promise.reject(error),
)

// Перехватчик ответов (обработка 401 ошибки)
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        // Если бэкенд ответил 401 (Unauthorized) и мы еще не пробовали повторить запрос
        // Игнорируем запросы на /auth/sync, чтобы избежать бесконечного цикла, когда
        // токен от Google считается невалидным, и интерцептор "спасает" ситуацию, регестрируя нового анонима,
        // что в итоге приводит к синхронизации (Аноним -> Аноним).
        if (
            error.response?.status === 401 && 
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/sync')
        ) {
            originalRequest._retry = true // Ставим флаг, чтобы не зациклиться

            const { user, setAuth, logout } = useAuthStore.getState()

            if (user?.deviceId) {
                try {
                    console.log('Попытка обновить протухший токен...')

                    // Отправляем девайс-id на инициализацию (наш "рефреш")
                    // Важно: используем чистый axios, а не apiClient, чтобы не попасть в петлю интерцепторов!
                    const response = await axios.post(`${BASE_URL}/auth/init-anonymous`, {
                        deviceId: user.deviceId,
                    })

                    const { accessToken, user: updatedUser } = response.data

                    // Сохраняем новый токен в секьюрное хранилище
                    setAuth(accessToken, updatedUser)

                    // Повторяем оригинальный упавший запрос с новым заголовком
                    originalRequest.headers.set('Authorization', `Bearer ${accessToken}`)
                    return axios(originalRequest)
                } catch (refreshError) {
                    console.error('Не удалось обновить токен. Разлогиниваем.', refreshError)
                    logout() // Если даже это не помогло — сбрасываем всё
                }
            } else {
                logout() // Токена нет, юзера нет — на выход
            }
        }

        return Promise.reject(error)
    },
)
