import React, { useEffect, useRef, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { LayoutType } from '../types/dto'
import { COLORS } from '../constants/theme'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Конфигурация звёзд-частиц
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
        y: Math.random() * 480,
        size: Math.random() * 2.5 + 1,
        duration: Math.random() * 3000 + 2500,
        delay: Math.random() * 3000,
        maxOpacity: Math.random() * 0.5 + 0.2,
    }))

// Звезда-частица
interface StarProps {
    config: StarConfig
}

const Star: React.FC<StarProps> = ({ config }) => {
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

// Конфигурация быстрых карточек-раскладов
interface QuickCardConfig {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    description: string
    layoutType?: LayoutType
}

const QUICK_CARDS: QuickCardConfig[] = [
    { icon: 'sunny-outline', label: 'Расклад дня', description: 'Ежедневное послание', layoutType: 'daily' },
    { icon: 'time-outline', label: 'Хронологический', description: 'Прошлое · Настоящее · Будущее', layoutType: 'chronological' },
    { icon: 'layers-outline', label: 'Свой расклад', description: 'Выбери сам', layoutType: undefined },
]

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>()

    const stars = useMemo(() => generateStars(), [])

    // Анимация появления
    const fadeIn = useRef(new Animated.Value(0)).current
    const slideUp = useRef(new Animated.Value(30)).current

    // Пульсация орба — внешнее свечение
    const outerGlow = useRef(new Animated.Value(0)).current
    // Пульсация орба — среднее кольцо
    const midGlow = useRef(new Animated.Value(0)).current
    // Мягкое вращение орба
    const orbRotate = useRef(new Animated.Value(0)).current
    // Пульсация кнопки
    const btnGlow = useRef(new Animated.Value(0)).current

    useEffect(() => {
        // Появление экрана
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

        // Пульсация внешнего свечения орба
        Animated.loop(
            Animated.sequence([
                Animated.timing(outerGlow, {
                    toValue: 1,
                    duration: 2800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(outerGlow, {
                    toValue: 0,
                    duration: 2800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()

        // Пульсация среднего кольца (со сдвигом фазы)
        Animated.loop(
            Animated.sequence([
                Animated.delay(900),
                Animated.timing(midGlow, {
                    toValue: 1,
                    duration: 2400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(midGlow, {
                    toValue: 0,
                    duration: 2400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()

        // Медленное «дыхание» орба (scale)
        Animated.loop(
            Animated.sequence([
                Animated.timing(orbRotate, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(orbRotate, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()

        // Пульсация кнопки CTA
        Animated.loop(
            Animated.sequence([
                Animated.timing(btnGlow, {
                    toValue: 1,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(btnGlow, {
                    toValue: 0,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()
    }, [fadeIn, slideUp, outerGlow, midGlow, orbRotate, btnGlow])

    const outerGlowScale = outerGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] })
    const outerGlowOpacity = outerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] })

    const midGlowScale = midGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] })
    const midGlowOpacity = midGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] })

    const orbScale = orbRotate.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] })

    const btnGlowOpacity = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] })
    const btnGlowScale = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] })

    return (
        <SafeAreaView style={styles.container}>
            {/* Фоновые звёзды */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {stars.map(s => (
                    <Star key={s.id} config={s} />
                ))}
            </View>

            {/* Верхняя панель */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('History')}>
                    <Ionicons name="journal-outline" size={26} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={26} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* Орб с многослойным свечением */}
                <Animated.View
                    style={[styles.orbSection, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
                    {/* Внешнее свечение (самый большой круг) */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.glowOuter,
                            {
                                transform: [{ scale: outerGlowScale }],
                                opacity: outerGlowOpacity,
                            },
                        ]}
                    />

                    {/* Среднее свечение */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.glowMid,
                            {
                                transform: [{ scale: midGlowScale }],
                                opacity: midGlowOpacity,
                            },
                        ]}
                    />

                    {/* Тело орба */}
                    <Animated.View style={[styles.orb, { transform: [{ scale: orbScale }] }]}>
                        {/* Внутренний блик */}
                        <View style={styles.orbHighlight} />
                    </Animated.View>

                    {/* Иконка луны внутри орба */}
                    <Animated.View style={[styles.moonIconWrapper, { transform: [{ scale: orbScale }] }]}>
                        <Ionicons name="moon" size={52} color={COLORS.glowCyan} />
                    </Animated.View>
                </Animated.View>

                {/* Заголовок */}
                <Animated.View
                    style={[
                        styles.titleSection,
                        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
                    ]}>
                    <Text style={styles.title}>Fortune AI</Text>
                    <Text style={styles.subtitle}>Вселенная готова ответить на твой вопрос</Text>
                </Animated.View>

                {/* Карточки быстрого доступа */}
                <Animated.View
                    style={[
                        styles.cardsSection,
                        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
                    ]}>
                    {QUICK_CARDS.map((card, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickCard}
                            onPress={() => navigation.navigate('SetupReading', card.layoutType ? { initialLayout: card.layoutType } : undefined)}
                            activeOpacity={0.7}>
                            <View style={styles.quickCardIcon}>
                                <Ionicons name={card.icon} size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.quickCardText}>
                                <Text style={styles.quickCardLabel}>{card.label}</Text>
                                <Text style={styles.quickCardDesc}>{card.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primaryBorder} />
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Кнопка CTA с пульсирующим glow */}
                <Animated.View
                    style={[
                        styles.ctaSection,
                        { opacity: fadeIn },
                    ]}>
                    {/* Glow-аура вокруг кнопки */}
                    <Animated.View
                        style={[
                            styles.btnGlowAura,
                            {
                                opacity: btnGlowOpacity,
                                transform: [{ scale: btnGlowScale }],
                            },
                        ]}
                    />
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={() => navigation.navigate('SetupReading')}
                        activeOpacity={0.85}>
                        <Ionicons name="sparkles" size={20} color={COLORS.background} style={styles.btnIcon} />
                        <Text style={styles.mainButtonText}>Сделать расклад</Text>
                    </TouchableOpacity>
                </Animated.View>

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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    iconButton: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: COLORS.whiteLight,
    },

    scrollContent: {
        alignItems: 'center',
        paddingBottom: 40,
    },

    // === ОРБ ===
    orbSection: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 240,
        height: 240,
        marginTop: 24,
        marginBottom: 8,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 999,
    },
    glowOuter: {
        width: 220,
        height: 220,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 60,
        elevation: 0,
    },
    glowMid: {
        width: 170,
        height: 170,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 0,
    },
    orb: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: COLORS.primaryMedium,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 12,
        position: 'absolute',
    },
    orbHighlight: {
        position: 'absolute',
        top: 18,
        left: 24,
        width: 40,
        height: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        transform: [{ rotate: '-15deg' }],
    },
    moonIconWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // === ЗАГОЛОВОК ===
    titleSection: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 28,
        paddingHorizontal: 24,
    },
    title: {
        color: COLORS.primary,
        fontSize: 38,
        fontWeight: '600',
        letterSpacing: 0,
        marginBottom: 10,
        textShadowColor: COLORS.primaryGlow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 15,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22,
        letterSpacing: 0.3,
    },

    // === КАРТОЧКИ ===
    cardsSection: {
        width: SCREEN_WIDTH - 32,
        gap: 10,
        marginBottom: 32,
    },
    quickCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    quickCardIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    quickCardText: {
        flex: 1,
    },
    quickCardLabel: {
        color: COLORS.textMain,
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 2,
    },
    quickCardDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        letterSpacing: 0.1,
    },

    // === КНОПКА CTA ===
    ctaSection: {
        alignItems: 'center',
        position: 'relative',
        width: SCREEN_WIDTH - 48,
    },
    btnGlowAura: {
        position: 'absolute',
        width: '100%',
        height: 56,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 0,
    },
    mainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    btnIcon: {
        marginBottom: 1,
    },
    mainButtonText: {
        color: COLORS.background,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // === ЗВЁЗДЫ ===
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
    },
})
