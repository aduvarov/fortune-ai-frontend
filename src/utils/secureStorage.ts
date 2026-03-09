import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

export const secureStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            // Пытаемся получить зашифрованную строку по ключу
            const value = await SecureStore.getItemAsync(name);
            return value || null;
        } catch (error) {
            console.error('Ошибка чтения из SecureStore:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            // Сохраняем строку в зашифрованном виде
            await SecureStore.setItemAsync(name, value);
        } catch (error) {
            console.error('Ошибка записи в SecureStore:', error);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            // Удаляем ключ (при логауте)
            await SecureStore.deleteItemAsync(name);
        } catch (error) {
            console.error('Ошибка удаления из SecureStore:', error);
        }
    },
};
