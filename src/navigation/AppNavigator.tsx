import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { SplashScreen } from '../screens/SplashScreen'
import { HomeScreen } from '../screens/HomeScreen'

// ВРЕМЕННЫЕ ЗАГЛУШКИ ЭКРАНОВ (потом перенесем в src/screens/)

const HistoryScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>📜 История Раскладов</Text>
    </View>
)
const SettingsScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>⚙️ Настройки и Лимиты</Text>
    </View>
)
const SetupReadingScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>✨ Настройка Расклада</Text>
    </View>
)
const VirtualTableScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>🃏 Виртуальный Стол</Text>
    </View>
)
const PhysicalInputScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>🖐 Ввод физических карт</Text>
    </View>
)
const ResultScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>👁 Ответ Вселенной (ИИ)</Text>
    </View>
)

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false, // Отключаем уродливые системные заголовки для атмосферы
                    contentStyle: { backgroundColor: '#0A0A1A' }, // Глубокий темный фон по умолчанию
                    animation: 'fade', // Плавное перетекание экранов (как туман)
                }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="SetupReading" component={SetupReadingScreen} />
                <Stack.Screen name="VirtualTable" component={VirtualTableScreen} />
                <Stack.Screen name="PhysicalInput" component={PhysicalInputScreen} />
                <Stack.Screen name="Result" component={ResultScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A0A1A', // Темно-синий/черный мистический фон
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#D4AF37', // Приглушенное золото
        fontSize: 24,
        fontWeight: 'bold',
    },
})
