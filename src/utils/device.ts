import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

const DEVICE_ID_KEY = 'tarot_device_id'

export const getOrCreateDeviceId = async (): Promise<string> => {
    try {
        // 1. Пытаемся найти уже существующий ID в безопасном хранилище
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY)

        // 2. Если его нет (первый запуск), генерируем новый криптографически стойкий UUID
        if (!deviceId) {
            deviceId = Crypto.randomUUID()
            await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId)
            console.log('Сгенерирован новый Device ID:', deviceId)
        } else {
            console.log('Найден существующий Device ID:', deviceId)
        }

        return deviceId
    } catch (error) {
        console.error('Ошибка при работе с Device ID:', error)
        // Фолбэк на случай непредвиденной ошибки хранилища
        return Crypto.randomUUID()
    }
}
