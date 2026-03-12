import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { getOrCreateDeviceId } from '../utils/device'
import { TarotApi } from '../api/tarot.api'
import { useAuthStore } from '../store/useAuthStore'
import { COLORS } from '../constants/theme'

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export const SplashScreen = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>()
    const setAuth = useAuthStore(state => state.setAuth)

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 1. Получаем или генерируем ID устройства
                const deviceId = await getOrCreateDeviceId()

                // 2. Стучимся на наш NestJS бэкенд для авторизации
                const response = await TarotApi.initAnonymous(deviceId)

                // 3. Сохраняем полученный токен и данные юзера в Zustand (и SecureStore)
                setAuth(response.accessToken, response.user)

                // 4. Плавно переводим пользователя на Главный экран.
                // Используем replace, чтобы юзер не мог вернуться назад на экран загрузки по свайпу
                navigation.replace('Home')
            } catch (error) {
                console.error('Ошибка инициализации приложения:', error)
                Alert.alert(
                    'Ошибка связи',
                    'Не удалось подключиться к серверу. Попробуйте еще раз.',
                    [{ text: 'Повторить', onPress: initializeApp }]
                )
            }
        }

        initializeApp()
    }, [navigation, setAuth])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FORTUNE AI</Text>
            <Text style={styles.subtitle}>Связь с космосом...</Text>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Наш фирменный мистический темный фон
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: COLORS.primary, // Золотой
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 3,
        marginBottom: 8,
    },
    subtitle: {
        color: COLORS.textSecondary, // Приглушенный серо-синий
        fontSize: 16,
        fontStyle: 'italic',
    },
    loader: {
        marginTop: 32,
    },
})
