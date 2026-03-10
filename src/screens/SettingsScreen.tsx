import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { COLORS } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TarotApi } from '../api/tarot.api';
import { RootStackParamList } from '../types/navigation';
import { ILimitStatus } from '../types/settings';
import { DrawSource } from '../types/dto';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

/** Сокращает UUID до формата "xxxx...xxxx" */
const shortenId = (id: string): string => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
};

/** Форматирование миллисекунд в "Xч Yм" */
const formatTimeLeft = (ms: number): string => {
    if (ms <= 0) return 'Доступно сейчас';
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
};

// ─── Секция-обёртка ────────────────────────────────────────────

interface ISectionProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
}

const Section: React.FC<ISectionProps> = ({ title, icon, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>{children}</View>
    </View>
);

// ─── Ряд настройки ─────────────────────────────────────────────

interface ISettingRowProps {
    label: string;
    value?: string;
    children?: React.ReactNode;
}

const SettingRow: React.FC<ISettingRowProps> = ({ label, value, children }) => (
    <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {children}
    </View>
);

// ─── Кнопка-переключатель (virtual / physical) ─────────────────

interface ISegmentButtonProps {
    options: { label: string; value: DrawSource }[];
    selected: DrawSource;
    onSelect: (value: DrawSource) => void;
}

const SegmentButton: React.FC<ISegmentButtonProps> = ({ options, selected, onSelect }) => (
    <View style={styles.segmentContainer}>
        {options.map((option) => {
            const isActive = option.value === selected;
            return (
                <TouchableOpacity
                    key={option.value}
                    style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                    onPress={() => onSelect(option.value)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.segmentButtonText,
                            isActive && styles.segmentButtonTextActive,
                        ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

// ─── Основной экран ─────────────────────────────────────────────

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsNavigationProp>();
    const { user, logout } = useAuthStore();
    const { hapticsEnabled, defaultDrawSource, toggleHaptics, setDefaultDrawSource } =
        useSettingsStore();

    const [limitStatus, setLimitStatus] = useState<ILimitStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
    const [isDeletingHistory, setIsDeletingHistory] = useState<boolean>(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Загрузка статуса лимита ──────────────────────────────

    const loadLimitStatus = useCallback(async () => {
        try {
            setIsLoadingStatus(true);
            const status: ILimitStatus = await TarotApi.checkStatus();
            setLimitStatus(status);
        } catch {
            setLimitStatus(null);
        } finally {
            setIsLoadingStatus(false);
        }
    }, []);

    useEffect(() => {
        void loadLimitStatus();
    }, [loadLimitStatus]);

    // ─── Таймер обратного отсчёта ─────────────────────────────

    useEffect(() => {
        if (limitStatus?.timeUntilNextFree && limitStatus.timeUntilNextFree > 0) {
            timerRef.current = setInterval(() => {
                setLimitStatus((prev) => {
                    if (!prev || !prev.timeUntilNextFree) return prev;
                    const newTime = prev.timeUntilNextFree - 60000;
                    if (newTime <= 0) {
                        return { canReadFree: true, timeUntilNextFree: null };
                    }
                    return { ...prev, timeUntilNextFree: newTime };
                });
            }, 60000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [limitStatus?.canReadFree]);

    // ─── Очистка истории ──────────────────────────────────────

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
                            setIsDeletingHistory(true);
                            // Загружаем все записи и удаляем по одной
                            const history = await TarotApi.getHistory(1, 100);
                            const items = history.data || history;
                            if (Array.isArray(items)) {
                                for (const item of items) {
                                    await TarotApi.deleteHistoryItem(
                                        (item as { id: string }).id,
                                    );
                                }
                            }
                            Alert.alert('Готово', 'История раскладов очищена.');
                        } catch {
                            Alert.alert('Ошибка', 'Не удалось очистить историю.');
                        } finally {
                            setIsDeletingHistory(false);
                        }
                    },
                },
            ],
        );
    };

    // ─── Выход ────────────────────────────────────────────────

    const handleLogout = () => {
        Alert.alert('Выйти из аккаунта', 'Вы уверены? Все локальные данные будут сброшены.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Выйти',
                style: 'destructive',
                onPress: () => {
                    logout();
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Splash' }],
                        }),
                    );
                },
            },
        ]);
    };

    // ─── Рендер лимита ────────────────────────────────────────

    const renderLimitStatus = () => {
        if (isLoadingStatus) {
            return <ActivityIndicator size="small" color={COLORS.primary} />;
        }

        if (!limitStatus) {
            return <Text style={styles.settingValue}>Недоступно</Text>;
        }

        if (limitStatus.canReadFree) {
            return (
                <View style={styles.limitBadge}>
                    <View style={[styles.statusDot, styles.statusDotActive]} />
                    <Text style={styles.limitTextAvailable}>Доступен</Text>
                </View>
            );
        }

        return (
            <View style={styles.limitBadge}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.limitTextWaiting}>
                    {formatTimeLeft(limitStatus.timeUntilNextFree ?? 0)}
                </Text>
            </View>
        );
    };

    // ─── UI ───────────────────────────────────────────────────

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <SafeAreaView style={styles.container}>
            {/* Заголовок с кнопкой «назад» */}
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
                showsVerticalScrollIndicator={false}
            >
                {/* ── Профиль ── */}
                <Section title="Профиль" icon="person-circle-outline">
                    <SettingRow
                        label="Device ID"
                        value={user?.deviceId ? shortenId(user.deviceId) : '—'}
                    />
                    <View style={styles.divider} />
                    <SettingRow label="Бесплатный расклад">
                        {renderLimitStatus()}
                    </SettingRow>
                </Section>

                {/* ── Настройки расклада ── */}
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

                {/* ── О приложении ── */}
                <Section title="О приложении" icon="information-circle-outline">
                    <SettingRow label="Версия" value={`v${appVersion}`} />
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={handleClearHistory}
                        disabled={isDeletingHistory}
                        activeOpacity={0.7}
                    >
                        {isDeletingHistory ? (
                            <ActivityIndicator size="small" color={COLORS.textSecondary} />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
                        )}
                        <Text style={styles.actionRowText}>Очистить историю раскладов</Text>
                    </TouchableOpacity>
                </Section>

                {/* ── Выход ── */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Выйти</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Стили ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Заголовок
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
        width: 36, // Балансирует кнопку «назад»
    },

    // Скролл
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    // Секция
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

    // Ряд настройки
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

    // Разделитель
    divider: {
        height: 1,
        backgroundColor: COLORS.whiteLight,
    },

    // Лимит
    limitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusDotActive: {
        backgroundColor: '#4ADE80',
    },
    limitTextAvailable: {
        color: '#4ADE80',
        fontSize: 14,
        fontWeight: '600',
    },
    limitTextWaiting: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },

    // Способ ввода
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

    // Кнопка-действие (очистить историю)
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

    // Кнопка «Выйти»
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
        height: 40,
    },
});
