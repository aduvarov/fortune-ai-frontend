import React from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { COLORS } from '../constants/theme'
import { getOrCreateDeviceId } from '../utils/device'
import { useAuthStore } from '../store/useAuthStore'
import { createMockToken, createMockUser } from '../utils/dev'

type DesignPlaygroundNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'DesignPlayground'
>

const SAMPLE_RESULT_CARDS = [
    {
        id: 'major_0',
        name: 'Шут',
        position: 'Прошлое',
        isReversed: false,
    },
    {
        id: 'major_1',
        name: 'Маг',
        position: 'Настоящее',
        isReversed: false,
    },
    {
        id: 'major_18',
        name: 'Луна',
        position: 'Будущее',
        isReversed: true,
    },
]

export const DesignPlaygroundScreen = () => {
    const navigation = useNavigation<DesignPlaygroundNavigationProp>()
    const setAuth = useAuthStore(state => state.setAuth)
    const logout = useAuthStore(state => state.logout)

    const applyMockState = async (
        provider: 'anonymous' | 'email' | 'google',
    ) => {
        const deviceId = await getOrCreateDeviceId()
        const email =
            provider === 'google'
                ? 'design@google.dev'
                : provider === 'email'
                  ? 'design@email.dev'
                  : undefined

        setAuth(
            createMockToken(provider),
            createMockUser(provider, deviceId, email),
        )
        navigation.navigate('Home')
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>UI Lab</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Mock Auth</Text>
                    <Text style={styles.cardText}>
                        Переключай состояния без Google SDK и без native rebuild.
                    </Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => applyMockState('anonymous')}>
                        <Text style={styles.actionText}>Mock Anonymous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => applyMockState('email')}>
                        <Text style={styles.actionText}>Mock Email User</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => applyMockState('google')}>
                        <Text style={styles.actionText}>Mock Google User</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={logout}>
                        <Text style={styles.secondaryText}>Reset Auth State</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Quick Screens</Text>
                    <Text style={styles.cardText}>
                        Открывай проблемные экраны напрямую для быстрых правок UI.
                    </Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Auth')}>
                        <Text style={styles.actionText}>Open Auth Screen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                            navigation.navigate('SetupReading', {
                                initialLayout: 'chronological',
                            })
                        }>
                        <Text style={styles.actionText}>Open Setup Flow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                            navigation.navigate('Result', {
                                layoutType: 'chronological',
                                drawSource: 'app',
                                cards: SAMPLE_RESULT_CARDS,
                                question: 'Что мне важно увидеть прямо сейчас?',
                            })
                        }>
                        <Text style={styles.actionText}>Open Result Screen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('History')}>
                        <Text style={styles.actionText}>Open History Screen</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    title: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: COLORS.modalBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 18,
        padding: 16,
    },
    cardTitle: {
        color: COLORS.textMain,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 14,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        color: COLORS.background,
        fontWeight: '700',
    },
    secondaryButton: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: COLORS.whiteLight,
    },
    secondaryText: {
        color: COLORS.textMain,
        fontWeight: '700',
    },
})
