import React from 'react'
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
import { SettingsScreen } from '../screens/SettingsScreen'
import { EnergyScreen } from '../screens/EnergyScreen'
import { DesignPlaygroundScreen } from '../screens/DesignPlaygroundScreen'
import { COLORS } from '../constants/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                    animation: 'fade',
                }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Energy" component={EnergyScreen} />
                <Stack.Screen name="SetupReading" component={SetupReadingScreen} />
                <Stack.Screen name="VirtualTable" component={VirtualTableScreen} />
                <Stack.Screen name="PhysicalInput" component={PhysicalInputScreen} />
                <Stack.Screen name="Result" component={ResultScreen} />
                <Stack.Screen name="Auth" component={require('../screens/AuthScreen').default} />
                <Stack.Screen
                    name="DesignPlayground"
                    component={DesignPlaygroundScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    )
}
