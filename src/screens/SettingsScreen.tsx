import React, { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'

import { COLORS } from '../constants/theme'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { TarotApi } from '../api/tarot.api'
import { RootStackParamList } from '../types/navigation'
import { DrawSource } from '../types/dto'

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>

const shortenId = (id: string): string => {
    if (id.length <= 12) return id
    return `${id.slice(0, 6)}...${id.slice(-6)}`
}

interface SectionProps {
    title: string
    icon: keyof typeof Ionicons.glyphMap
    children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>{children}</View>
    </View>
)

interface SettingRowProps {
    label: string
    value?: string
    children?: React.ReactNode
}

const SettingRow: React.FC<SettingRowProps> = ({ label, value, children }) => (
    <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {children}
    </View>
)

interface SegmentButtonProps {
    options: { label: string; value: DrawSource }[]
    selected: DrawSource
    onSelect: (value: DrawSource) => void
}

const SegmentButton: React.FC<SegmentButtonProps> = ({ options, selected, onSelect }) => (
    <View style={styles.segmentContainer}>
        {options.map(option => {
            const isActive = option.value === selected
            return (
                <TouchableOpacity
                    key={option.value}
                    style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                    onPress={() => onSelect(option.value)}
                    activeOpacity={0.7}>
                    <Text
                        style={[
                            styles.segmentButtonText,
                            isActive && styles.segmentButtonTextActive,
                        ]}>
                        {option.label}
                    </Text>
                </TouchableOpacity>
            )
        })}
    </View>
)

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsNavigationProp>()
    const { user, energyBalance, logout } = useAuthStore()
    const { hapticsEnabled, defaultDrawSource, toggleHaptics, setDefaultDrawSource } =
        useSettingsStore()

    const [isDeletingHistory, setIsDeletingHistory] = useState(false)

    const handleClearHistory = () => {
        Alert.alert(
            'Очистить историю',
            'Все ваши расклады будут безвозвратно удалены. Продолжить?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить всё',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeletingHistory(true)
                            const history = await TarotApi.getHistory(1, 100)
                            const items = history.data || history
                            if (Array.isArray(items)) {
                                for (const item of items) {
                                    await TarotApi.deleteHistoryItem(
                                        (item as { id: string }).id,
                                    )
                                }
                            }
                            Alert.alert('Готово', 'История раскладов очищена.')
                        } catch {
                            Alert.alert('Ошибка', 'Не удалось очистить историю.')
                        } finally {
                            setIsDeletingHistory(false)
                        }
                    },
                },
            ],
        )
    }

    const handleLogout = () => {
        Alert.alert('Выйти из аккаунта', 'Вы уверены? Все локальные данные будут сброшены.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Выйти',
                style: 'destructive',
                onPress: () => {
                    logout()
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Splash' }],
                        }),
                    )
                },
            },
        ])
    }

    const appVersion = Constants.expoConfig?.version ?? '1.0.0'

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Настройки</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <Section title="Энергия" icon="flash-outline">
                    <SettingRow label="Текущий баланс">
                        <TouchableOpacity
                            style={styles.energyBadge}
                            onPress={() => navigation.navigate('Energy')}>
                            <Ionicons name="flash" size={16} color={COLORS.primary} />
                            <Text style={styles.energyBadgeText}>{energyBalance ?? 0}</Text>
                        </TouchableOpacity>
                    </SettingRow>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Energy')}
                        activeOpacity={0.7}>
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.actionPrimaryText}>Открыть пополнение энергии</Text>
                    </TouchableOpacity>
                </Section>

                <Section title="Профиль" icon="person-circle-outline">
                    <SettingRow
                        label="Device ID"
                        value={user?.deviceId ? shortenId(user.deviceId) : '—'}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        label="Почта"
                        value={user?.email || (user?.authProvider === 'anonymous' ? 'Анонимный режим' : '—')}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        label="Способ входа"
                        value={user?.authProvider ? user.authProvider.toUpperCase() : '—'}
                    />
                </Section>

                <Section title="Настройки расклада" icon="options-outline">
                    <SettingRow label="Вибрация при тасовании">
                        <Switch
                            value={hapticsEnabled}
                            onValueChange={toggleHaptics}
                            trackColor={{
                                false: COLORS.whiteLight,
                                true: COLORS.primaryBorder,
                            }}
                            thumbColor={hapticsEnabled ? COLORS.primary : COLORS.textSecondary}
                        />
                    </SettingRow>
                    <View style={styles.divider} />
                    <View style={styles.drawSourceSetting}>
                        <Text style={styles.settingLabel}>Способ ввода по умолчанию</Text>
                        <SegmentButton
                            options={[
                                { label: '✨ Виртуальный', value: 'app' },
                                { label: '🃏 Физический', value: 'physical' },
                            ]}
                            selected={defaultDrawSource}
                            onSelect={setDefaultDrawSource}
                        />
                    </View>
                </Section>

                <Section title="О приложении" icon="information-circle-outline">
                    <SettingRow label="Версия" value={`v${appVersion}`} />
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={handleClearHistory}
                        disabled={isDeletingHistory}
                        activeOpacity={0.7}>
                        {isDeletingHistory ? (
                            <ActivityIndicator size="small" color={COLORS.textSecondary} />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
                        )}
                        <Text style={styles.actionRowText}>Очистить историю раскладов</Text>
                    </TouchableOpacity>
                </Section>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Выйти</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
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
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: COLORS.textMain,
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    headerSpacer: {
        width: 36,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    section: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    sectionTitle: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        minHeight: 48,
    },
    settingLabel: {
        color: COLORS.textMain,
        fontSize: 15,
    },
    settingValue: {
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.whiteLight,
    },
    energyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    energyBadgeText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    drawSourceSetting: {
        paddingVertical: 12,
        gap: 12,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.whiteLight,
        borderRadius: 12,
        padding: 3,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    segmentButtonActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    segmentButtonText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    segmentButtonTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    actionRowText: {
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    actionPrimaryText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
        paddingVertical: 16,
        marginBottom: 16,
    },
    logoutText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 16,
    },
})
