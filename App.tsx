import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
    return (
        <>
            {/* Делаем статус-бар (время, батарея) светлым на нашем темном фоне */}
            <StatusBar style="light" />
            <AppNavigator />
        </>
    )
}
