import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { SplashScreen } from '../screens/SplashScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { SetupReadingScreen } from '../screens/SetupReadingScreen'
import { PhysicalInputScreen } from '../screens/PhysicalInputScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { VirtualTableScreen } from '../screens/VirtualTableScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { COLORS } from '../constants/theme'

const SettingsScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>⚙️ Настройки и Лимиты</Text>
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
                    contentStyle: { backgroundColor: COLORS.background }, // Глубокий темный фон по умолчанию
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
        backgroundColor: COLORS.background, // Темно-синий/черный мистический фон
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: COLORS.primary, // Приглушенное золото -> Мистический синий
        fontSize: 24,
        fontWeight: 'bold',
    },
})
