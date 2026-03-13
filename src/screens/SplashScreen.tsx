import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { getOrCreateDeviceId } from '../utils/device'
import { TarotApi } from '../api/tarot.api'
import { EnergyApi } from '../api/energy.api'
import { useAuthStore } from '../store/useAuthStore'
import { COLORS } from '../constants/theme'
import {
    createMockToken,
    createMockUser,
    getMockEnergyBalance,
    isMockAuthEnabled,
} from '../utils/dev'

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export const SplashScreen = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>()
    const setAuth = useAuthStore(state => state.setAuth)
    const setEnergyBalance = useAuthStore(state => state.setEnergyBalance)
    const token = useAuthStore(state => state.token)
    const user = useAuthStore(state => state.user)
    const isHydrated = useAuthStore(state => state.isHydrated)

    useEffect(() => {
        const initializeApp = async () => {
            try {
                if (!isHydrated) {
                    return
                }

                if (token && user) {
                    if (isMockAuthEnabled) {
                        setEnergyBalance(getMockEnergyBalance(user.authProvider))
                    } else {
                        const energy = await EnergyApi.getBalance()
                        setEnergyBalance(energy.balance)
                    }
                    navigation.replace('Home')
                    return
                }

                // 1. Получаем или генерируем ID устройства
                const deviceId = await getOrCreateDeviceId()

                if (isMockAuthEnabled) {
                    setAuth(
                        createMockToken('anonymous'),
                        createMockUser('anonymous', deviceId),
                    )
                    setEnergyBalance(getMockEnergyBalance('anonymous'))
                    navigation.replace('Home')
                    return
                }

                // 2. Стучимся на наш NestJS бэкенд для авторизации
                const response = await TarotApi.initAnonymous(deviceId)

                // 3. Сохраняем полученный токен и данные юзера в Zustand (и SecureStore)
                setAuth(response.accessToken, response.user)
                const energy = await EnergyApi.getBalance()
                setEnergyBalance(energy.balance)

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
    }, [isHydrated, navigation, setAuth, setEnergyBalance, token, user])

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
