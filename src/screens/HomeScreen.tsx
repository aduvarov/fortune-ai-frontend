import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons' // Встроенные иконки Expo
import { RootStackParamList } from '../types/navigation'

// Типизируем навигацию для этого конкретного экрана
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>()

    return (
        <SafeAreaView style={styles.container}>
            {/* Верхняя панель (Фокусная навигация) */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('History')}>
                    <Ionicons name="journal-outline" size={28} color="#D4AF37" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={28} color="#D4AF37" />
                </TouchableOpacity>
            </View>

            {/* Центральная часть экрана */}
            <View style={styles.centerContent}>
                {/* Здесь в будущем можно добавить красивую картинку или Lottie-анимацию */}
                <Ionicons name="moon-outline" size={80} color="#D4AF37" style={styles.heroIcon} />

                <Text style={styles.title}>Fortune AI</Text>
                <Text style={styles.subtitle}>Вселенная готова ответить на твой вопрос.</Text>

                {/* Главная кнопка действия */}
                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => navigation.navigate('SetupReading')}
                    activeOpacity={0.8}>
                    <Text style={styles.mainButtonText}>Сделать расклад</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A', // Глубокий ночной фон
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    iconButton: {
        padding: 8, // Увеличиваем зону нажатия для пальца (хитбокс)
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 60, // Немного смещаем контент визуально вверх
    },
    heroIcon: {
        marginBottom: 24,
        opacity: 0.9,
    },
    title: {
        color: '#D4AF37', // Золотой
        fontSize: 36,
        fontWeight: '300', // Легкий, "воздушный" шрифт
        letterSpacing: 6,
        marginBottom: 12,
    },
    subtitle: {
        color: '#8A8A9E',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 48,
        fontStyle: 'italic',
    },
    mainButton: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)', // Полупрозрачный золотой фон
        borderColor: '#D4AF37',
        borderWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30, // Скругленные края
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5, // Тень для Android
    },
    mainButtonText: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
})
