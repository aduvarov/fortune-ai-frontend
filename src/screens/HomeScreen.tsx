import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { RootStackParamList } from '../types/navigation'
import { COLORS } from '../constants/theme'
import { useAuthStore } from '../store/useAuthStore'
import { EnergyApi } from '../api/energy.api'
import { isMockAuthEnabled } from '../utils/dev'
import { useSettingsStore } from '../store/useSettingsStore'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface StarConfig {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    maxOpacity: number
}

const STAR_COUNT = 18

const generateStars = (): StarConfig[] =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * 500,
        size: Math.random() * 2.5 + 1,
        duration: Math.random() * 3000 + 2500,
        delay: Math.random() * 3000,
        maxOpacity: Math.random() * 0.5 + 0.2,
    }))

const Star: React.FC<{ config: StarConfig }> = ({ config }) => {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(config.delay),
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: config.maxOpacity,
                        duration: config.duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -8,
                        duration: config.duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: config.duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: config.duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ).start()
    }, [config, opacity, translateY])

    return (
        <Animated.View
            style={[
                styles.star,
                {
                    left: config.x,
                    top: config.y,
                    width: config.size,
                    height: config.size,
                    borderRadius: config.size / 2,
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        />
    )
}

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>()
    const user = useAuthStore(state => state.user)
    const energyBalance = useAuthStore(state => state.energyBalance)
    const setEnergyBalance = useAuthStore(state => state.setEnergyBalance)
    const { aiConsentAccepted, setAiConsentAccepted, hapticsEnabled } = useSettingsStore()

    const stars = useMemo(() => generateStars(), [])
    const [isInfoVisible, setIsInfoVisible] = useState(false)
    const [isConsentVisible, setIsConsentVisible] = useState(false)
    const [aiChecked, setAiChecked] = useState(false)
    const [termsChecked, setTermsChecked] = useState(false)

    const fadeIn = useRef(new Animated.Value(0)).current
    const slideUp = useRef(new Animated.Value(24)).current
    const orbPulse = useRef(new Animated.Value(0)).current
    const ctaPulse = useRef(new Animated.Value(0)).current
    const ctaShake = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideUp, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start()

        Animated.loop(
            Animated.sequence([
                Animated.timing(orbPulse, {
                    toValue: 1,
                    duration: 2600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(orbPulse, {
                    toValue: 0,
                    duration: 2600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()
    }, [fadeIn, slideUp, orbPulse])

    useEffect(() => {
        if (aiConsentAccepted) {
            ctaPulse.stopAnimation()
            ctaShake.stopAnimation()
            ctaPulse.setValue(0)
            ctaShake.setValue(0)
            return
        }

        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(ctaPulse, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(ctaPulse, {
                    toValue: 0,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.delay(1800),
            ]),
        )

        const shakeLoop = Animated.loop(
            Animated.sequence([
                Animated.delay(2200),
                Animated.timing(ctaShake, {
                    toValue: 1,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(ctaShake, {
                    toValue: -1,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(ctaShake, {
                    toValue: 1,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(ctaShake, {
                    toValue: 0,
                    duration: 80,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.delay(1800),
            ]),
        )

        pulseLoop.start()
        shakeLoop.start()

        let interval: ReturnType<typeof setInterval> | null = null
        if (hapticsEnabled) {
            interval = setInterval(() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }, 4200)
        }

        return () => {
            pulseLoop.stop()
            shakeLoop.stop()
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [aiConsentAccepted, ctaPulse, ctaShake, hapticsEnabled])

    const refreshBalance = useCallback(async () => {
        if (isMockAuthEnabled) {
            return
        }

        try {
            const { balance } = await EnergyApi.getBalance()
            setEnergyBalance(balance)
        } catch (error) {
            console.error('Не удалось обновить баланс энергии', error)
        }
    }, [setEnergyBalance])

    useFocusEffect(
        useCallback(() => {
            void refreshBalance()
        }, [refreshBalance]),
    )

    const moonScale = orbPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.98, 1.04],
    })
    const moonGlowOpacity = orbPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.28, 0.55],
    })
    const ctaScale = ctaPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.03],
    })
    const ctaGlowOpacity = ctaPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.75],
    })
    const ctaTranslateX = ctaShake.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-5, 0, 5],
    })

    const openConsentModal = () => {
        setAiChecked(aiConsentAccepted)
        setTermsChecked(aiConsentAccepted)
        setIsConsentVisible(true)
    }

    const handlePrimaryAction = async () => {
        if (!aiConsentAccepted) {
            if (hapticsEnabled) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            }
            openConsentModal()
            return
        }

        navigation.navigate('SetupReading')
    }

    const handleConfirmConsent = async () => {
        const nextConsentAccepted = aiChecked && termsChecked

        setAiConsentAccepted(nextConsentAccepted)
        setIsConsentVisible(false)
        setAiChecked(nextConsentAccepted)
        setTermsChecked(nextConsentAccepted)

        if (hapticsEnabled) {
            await Haptics.notificationAsync(
                nextConsentAccepted
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning,
            )
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {stars.map(star => (
                    <Star key={star.id} config={star} />
                ))}
            </View>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.balanceInline}
                    onPress={() => navigation.navigate('Energy')}>
                    <Ionicons name="flash" size={18} color={COLORS.primary} />
                    <Text style={styles.balanceInlineText}>{energyBalance ?? 0}</Text>
                </TouchableOpacity>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.iconButton, { marginRight: 10 }]}
                        onPress={() => navigation.navigate('History')}>
                        <Ionicons name="journal-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <Animated.View
                    style={[
                        styles.heroStage,
                        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
                    ]}>
                    <Animated.View
                        style={[
                            styles.moonGlow,
                            { opacity: moonGlowOpacity, transform: [{ scale: moonScale }] },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.moonCore,
                            { transform: [{ scale: moonScale }] },
                        ]}>
                        <View style={styles.orbHighlight} />
                        <Ionicons name="moon" size={64} color={COLORS.glowCyan} />
                    </Animated.View>

                    <View style={styles.heroTextBlock}>
                        <Text style={styles.heroTitle}>Fortune AI</Text>
                        <Text style={styles.heroSubtitle}>
                            Интерпретации карт создаются искусственным интеллектом
                            на основе выбранного расклада и твоего вопроса.
                        </Text>
                        <Text style={styles.heroCaption}>
                            Выбирай расклад, пополняй энергию и сохраняй историю в аккаунте.
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.cardsSection,
                        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
                    ]}>
                    <TouchableOpacity
                        style={styles.infoCard}
                        onPress={() => setIsInfoVisible(true)}
                        activeOpacity={0.85}>
                        <View style={styles.infoCardIcon}>
                            <Ionicons
                                name="information-circle-outline"
                                size={22}
                                color={COLORS.primary}
                            />
                        </View>
                        <View style={styles.infoCardText}>
                            <Text style={styles.infoCardTitle}>Как это работает</Text>
                            <Text style={styles.infoCardSubtitle}>
                                Энергия, реклама, бонусы за вход и как пользоваться приложением.
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={COLORS.primaryBorder}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.infoCard,
                            !aiConsentAccepted && styles.infoCardWarning,
                        ]}
                        onPress={openConsentModal}
                        activeOpacity={0.85}>
                        <View
                            style={[
                                styles.infoCardIcon,
                                !aiConsentAccepted && styles.infoCardIconWarning,
                            ]}>
                            <Ionicons
                                name={aiConsentAccepted ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                                size={22}
                                color={aiConsentAccepted ? COLORS.primary : COLORS.accentGold}
                            />
                        </View>
                        <View style={styles.infoCardText}>
                            <Text style={styles.infoCardTitle}>Согласие с ИИ-контентом</Text>
                            {aiConsentAccepted ? (
                                <View style={styles.consentBadge}>
                                    <Text style={styles.consentBadgeText}>Подтверждено</Text>
                                </View>
                            ) : null}
                            {!aiConsentAccepted ? (
                                <Text style={styles.infoCardSubtitle}>
                                    Нужно подтвердить перед первым раскладом.
                                </Text>
                            ) : null}
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={COLORS.primaryBorder}
                        />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.ctaSection,
                        {
                            opacity: fadeIn,
                            transform: [{ scale: aiConsentAccepted ? 1 : ctaScale }, { translateX: aiConsentAccepted ? 0 : ctaTranslateX }],
                        },
                    ]}>
                    <Animated.View
                        style={[
                            styles.btnGlowAura,
                            { opacity: aiConsentAccepted ? 0.5 : ctaGlowOpacity },
                        ]}
                    />
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handlePrimaryAction}
                        activeOpacity={0.9}>
                        <Ionicons
                            name={aiConsentAccepted ? 'sparkles' : 'checkmark-circle-outline'}
                            size={20}
                            color={COLORS.background}
                            style={styles.btnIcon}
                        />
                        <Text style={styles.mainButtonText}>
                            {aiConsentAccepted
                                ? 'Сделать расклад'
                                : 'Подтвердить и продолжить'}
                        </Text>
                    </TouchableOpacity>
                    {!aiConsentAccepted ? (
                        <Text style={styles.ctaHint}>
                            Сначала подтверди, что понимаешь природу ИИ-контента.
                        </Text>
                    ) : null}
                </Animated.View>

                {isMockAuthEnabled && (
                    <TouchableOpacity
                        style={styles.devLabButton}
                        onPress={() => navigation.navigate('DesignPlayground')}>
                        <Ionicons name="flask-outline" size={18} color={COLORS.background} />
                        <Text style={styles.devLabText}>UI Lab</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal visible={isInfoVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setIsInfoVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={event => event.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Как это работает</Text>
                            <TouchableOpacity onPress={() => setIsInfoVisible(false)}>
                                <Ionicons name="close" size={26} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Что здесь происходит</Text>
                            <Text style={styles.modalSectionText}>
                                Все интерпретации создаются ИИ на основе выбранных карт и твоего вопроса.
                            </Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Энергия</Text>
                            <Text style={styles.modalSectionText}>
                                Каждый расклад тратит энергию: -10 за каждую карту. За просмотр рекламы начисляется +10.
                            </Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Бонусы и аккаунт</Text>
                            <Text style={styles.modalSectionText}>
                                За первый вход в аккаунт начисляется +50 энергии. После входа история и баланс сохраняются между сессиями.
                            </Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Важно</Text>
                            <Text style={styles.modalSectionText}>
                                Контент генерируется ИИ и не является медицинской, психологической или юридической консультацией.
                            </Text>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={isConsentVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setIsConsentVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={event => event.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Перед первым раскладом</Text>
                            <TouchableOpacity onPress={() => setIsConsentVisible(false)}>
                                <Ionicons name="close" size={26} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.consentLead}>
                            Ответы в приложении создаются искусственным интеллектом и не являются профессиональной рекомендацией.
                        </Text>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setAiChecked(prev => !prev)}
                            activeOpacity={0.8}>
                            <View style={[styles.checkbox, aiChecked && styles.checkboxActive]}>
                                {aiChecked ? (
                                    <Ionicons name="checkmark" size={16} color={COLORS.background} />
                                ) : null}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                Я понимаю, что контент в приложении генерируется ИИ.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setTermsChecked(prev => !prev)}
                            activeOpacity={0.8}>
                            <View
                                style={[
                                    styles.checkbox,
                                    termsChecked && styles.checkboxActive,
                                ]}>
                                {termsChecked ? (
                                    <Ionicons name="checkmark" size={16} color={COLORS.background} />
                                ) : null}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                Я принимаю развлекательный и справочный характер сервиса.
                            </Text>
                        </TouchableOpacity>

                        {!(aiChecked && termsChecked) ? (
                            <View style={styles.revokeNotice}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={18}
                                    color={COLORS.accentGold}
                                />
                                <Text style={styles.revokeNoticeText}>
                                    После отзыва согласия доступ к раскладам будет временно закрыт.
                                </Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={handleConfirmConsent}
                            activeOpacity={0.85}>
                            <Text style={styles.modalPrimaryButtonText}>
                                {aiChecked && termsChecked
                                    ? 'Сохранить согласие'
                                    : 'Отозвать согласие'}
                            </Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    balanceInlineText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: '700',
    },
    iconButton: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: COLORS.whiteLight,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 36,
    },
    heroStage: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 18,
    },
    moonGlow: {
        position: 'absolute',
        top: 30,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 60,
        elevation: 0,
    },
    moonCore: {
        width: 144,
        height: 144,
        borderRadius: 72,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryMedium,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        marginBottom: 28,
    },
    orbHighlight: {
        position: 'absolute',
        top: 22,
        left: 26,
        width: 44,
        height: 26,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        transform: [{ rotate: '-15deg' }],
    },
    heroTextBlock: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    heroTitle: {
        color: COLORS.primary,
        fontSize: 38,
        fontWeight: '600',
        marginBottom: 12,
        textShadowColor: COLORS.primaryGlow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },
    heroSubtitle: {
        color: COLORS.textMain,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 25,
        marginBottom: 10,
    },
    heroCaption: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        maxWidth: 310,
    },
    cardsSection: {
        gap: 12,
        marginTop: 8,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    infoCardWarning: {
        borderColor: 'rgba(201, 168, 76, 0.38)',
        backgroundColor: 'rgba(201, 168, 76, 0.08)',
    },
    infoCardIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        marginRight: 14,
    },
    infoCardIconWarning: {
        backgroundColor: 'rgba(201, 168, 76, 0.12)',
        borderColor: 'rgba(201, 168, 76, 0.3)',
    },
    infoCardText: {
        flex: 1,
        paddingRight: 10,
    },
    infoCardTitle: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    infoCardSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 19,
    },
    consentBadge: {
        alignSelf: 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(201, 168, 76, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(201, 168, 76, 0.34)',
    },
    consentBadgeText: {
        color: COLORS.accentGold,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ctaSection: {
        marginTop: 24,
        alignItems: 'center',
        position: 'relative',
    },
    btnGlowAura: {
        position: 'absolute',
        width: '100%',
        height: 58,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 0,
    },
    mainButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 17,
        borderRadius: 30,
    },
    btnIcon: {
        marginRight: 8,
    },
    mainButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    ctaHint: {
        marginTop: 12,
        color: COLORS.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
    devLabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 18,
    },
    devLabText: {
        color: COLORS.background,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4, 8, 20, 0.78)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: COLORS.modalBackground,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    modalTitle: {
        color: COLORS.textMain,
        fontSize: 20,
        fontWeight: '700',
    },
    modalSection: {
        marginTop: 10,
    },
    modalSectionTitle: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    modalSectionText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    consentLead: {
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 18,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        backgroundColor: COLORS.whiteLight,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        flex: 1,
        color: COLORS.textMain,
        fontSize: 14,
        lineHeight: 21,
    },
    modalPrimaryButton: {
        marginTop: 8,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        alignItems: 'center',
    },
    revokeNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(201, 168, 76, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(201, 168, 76, 0.24)',
        padding: 12,
        marginBottom: 14,
    },
    revokeNoticeText: {
        flex: 1,
        color: COLORS.accentGold,
        fontSize: 13,
        lineHeight: 19,
    },
    modalPrimaryButtonText: {
        color: COLORS.background,
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
})
