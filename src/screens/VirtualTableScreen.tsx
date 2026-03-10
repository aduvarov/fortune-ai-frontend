import React, { useState, useRef, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    Easing,
    Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics' // <-- Импорт тактильного отклика
import { RootStackParamList } from '../types/navigation'
import { TAROT_DECK, LAYOUT_CONFIG, TarotCardDef } from '../constants/tarot'
import { TAROT_IMAGES } from '../constants/tarotImages'
import { COLORS } from '../constants/theme'

type VirtualTableRouteProp = RouteProp<RootStackParamList, 'VirtualTable'>
type VirtualTableNavProp = NativeStackNavigationProp<RootStackParamList, 'VirtualTable'>

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array]
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
    }
    return newArr
}

export const VirtualTableScreen = () => {
    const route = useRoute<VirtualTableRouteProp>()
    const navigation = useNavigation<VirtualTableNavProp>()
    const layoutType = route.params.layoutType as keyof typeof LAYOUT_CONFIG
    const question = route.params.question
    const positions = LAYOUT_CONFIG[layoutType]

    const [deck, setDeck] = useState<TarotCardDef[]>([])
    const [drawnCards, setDrawnCards] = useState<(TarotCardDef & { isReversed: boolean })[]>([])
    const [phase, setPhase] = useState<'shuffling' | 'drawing' | 'done'>('shuffling')
    const [hintMsg, setHintMsg] = useState('Колода тасуется...')

    const phaseRef = useRef(phase)
    const deckRef = useRef(deck)
    const drawnCountRef = useRef(0)
    const chargeStartTime = useRef<number>(0)

    useEffect(() => {
        phaseRef.current = phase
        deckRef.current = deck
    }, [phase, deck])

    // Анимации пульсации и полета карт
    const pulseAnim = useRef(new Animated.Value(0)).current
    const entryAnims = useRef(positions.map(() => new Animated.Value(0))).current
    const flipAnims = useRef(positions.map(() => new Animated.Value(0))).current

    // Анимации для визуального тасования (3 дополнительные разлетающиеся карты)
    const shuffleAnim1 = useRef(new Animated.Value(0)).current
    const shuffleAnim2 = useRef(new Animated.Value(0)).current
    const shuffleAnim3 = useRef(new Animated.Value(0)).current

    useEffect(() => {
        setDeck(shuffleArray(TAROT_DECK))

        // Создаем сложную анимацию тасования (разлет и сборка)
        const shuffleAnimation = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(shuffleAnim1, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(shuffleAnim2, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(shuffleAnim3, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(shuffleAnim1, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(shuffleAnim2, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(shuffleAnim3, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        )

        shuffleAnimation.start()

        // Запускаем пульсирующую вибрацию во время тасования
        const hapticInterval = setInterval(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }, 300) // Каждые 300мс (на каждое сведение/разведение карт)

        // Рандомное время тасования от 3.5 до 5 секунд
        const shuffleTime = Math.floor(Math.random() * 1500) + 3500

        const timer = setTimeout(() => {
            shuffleAnimation.stop()
            clearInterval(hapticInterval) // Останавливаем вибрацию

            // Финальный сильный щелчок по завершении тасования
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

            // Возвращаем все "теневые" карты строго в центр
            Animated.parallel([
                Animated.timing(shuffleAnim1, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(shuffleAnim2, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(shuffleAnim3, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => {
                setPhase('drawing')
                setHintMsg('Водите пальцем по колоде (2 сек)')
            })
        }, shuffleTime)

        return () => {
            clearTimeout(timer)
            clearInterval(hapticInterval)
        }
    }, [])

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start()
    }

    const stopPulse = () => {
        pulseAnim.stopAnimation()
        pulseAnim.setValue(0)
    }

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => phaseRef.current === 'drawing',
            onMoveShouldSetPanResponder: () => phaseRef.current === 'drawing',

            onPanResponderGrant: () => {
                chargeStartTime.current = Date.now()
                setHintMsg('Передаю энергию...')
                startPulse()
                // Легкий щелчок при касании колоды
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            },
            onPanResponderRelease: (evt, gestureState) => {
                stopPulse()
                const chargeTime = Date.now() - chargeStartTime.current
                const currentIdx = drawnCountRef.current

                if (chargeTime >= 2000) {
                    if (currentIdx >= positions.length) return

                    const currentDeck = deckRef.current
                    const cutIndex = Math.floor(
                        ((Math.abs(gestureState.moveX) % 100) / 100) * currentDeck.length,
                    )
                    const top = currentDeck.slice(0, cutIndex)
                    const bottom = currentDeck.slice(cutIndex)
                    const newDeck = [...bottom, ...top]

                    const drawnCard = newDeck[0]
                    const isReversed = Math.random() > 0.85 // Шанс 20% (исправлено!)

                    setDeck(newDeck.slice(1))
                    setDrawnCards(d => [...d, { ...drawnCard, isReversed }])
                    drawnCountRef.current += 1

                    // Щелчок при успешной "зарядке" и вылете карты
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

                    Animated.parallel([
                        Animated.spring(entryAnims[currentIdx], {
                            toValue: 1,
                            friction: 5,
                            tension: 40,
                            useNativeDriver: true,
                        }),
                        Animated.timing(flipAnims[currentIdx], {
                            toValue: 1,
                            duration: 600,
                            delay: 300,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        if (drawnCountRef.current === positions.length) {
                            setPhase('done')
                            setHintMsg('Все карты разложены')
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                        } else {
                            setHintMsg('Водите пальцем по колоде (2 сек)')
                        }
                    })
                } else {
                    setHintMsg('Слишком быстро. Держите палец дольше (2 сек)')
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) // Ошибка - короткая вибрация
                }
            },
        }),
    ).current

    const handleFinish = () => {
        const formattedCards = drawnCards.map((card, index) => ({
            id: card.id,
            name: card.name,
            position: positions[index].title,
            isReversed: card.isReversed,
        }))
        navigation.replace('Result', {
            layoutType,
            drawSource: 'app',
            cards: formattedCards,
            question,
        }) // <-- добавили question    }
    }
    const auraScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] })
    const textScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] })
    const auraOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.8] })

    // Интерполяции для "разлетающихся" карт тасования
    const shuffleX1 = shuffleAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -60] })
    const shuffleRotate1 = shuffleAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-15deg'],
    })

    const shuffleX2 = shuffleAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] })
    const shuffleRotate2 = shuffleAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'],
    })

    const shuffleY3 = shuffleAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -30] })
    const shuffleRotate3 = shuffleAnim3.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '5deg'],
    })

    const currentPositionName =
        drawnCountRef.current < positions.length ? positions[drawnCountRef.current].title : ''

    // Компонент для рендера рубашки
    const renderCardBack = () => {
        if (TAROT_IMAGES['card_back']) {
            return <Image source={TAROT_IMAGES['card_back']} style={styles.mainDeckImage} />
        }
        return <View style={styles.mainDeckPlaceholder} />
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Виртуальный Стол</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.slotsContainer}>
                {positions.map((pos, index) => {
                    const card = drawnCards[index]

                    const translateY = entryAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                    })
                    const scale = entryAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                    })

                    const frontFlip = flipAnims[index].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['180deg', '90deg', '0deg'],
                    })
                    const backFlip = flipAnims[index].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['0deg', '-90deg', '-180deg'],
                    })

                    return (
                        <View key={pos.id} style={styles.slotWrapper}>
                            <Text style={styles.slotText}>{pos.title}</Text>

                            <View style={styles.slotBorder}>
                                {card && (
                                    <Animated.View
                                        style={[
                                            styles.flyingCard,
                                            { transform: [{ translateY }, { scale }] },
                                        ]}>
                                        <Animated.View
                                            style={[
                                                styles.cardFace,
                                                styles.cardBackAbsolute,
                                                { transform: [{ rotateY: backFlip }] },
                                            ]}>
                                            {TAROT_IMAGES['card_back'] ? (
                                                <Image
                                                    source={TAROT_IMAGES['card_back']}
                                                    style={styles.cardImage}
                                                />
                                            ) : (
                                                <View style={styles.deckPlaceholder} />
                                            )}
                                        </Animated.View>

                                        <Animated.View
                                            style={[
                                                styles.cardFace,
                                                {
                                                    transform: [
                                                        { rotateY: frontFlip },
                                                        {
                                                            rotateZ: card.isReversed
                                                                ? '180deg'
                                                                : '0deg',
                                                        },
                                                    ],
                                                },
                                            ]}>
                                            {TAROT_IMAGES[card.id] ? (
                                                <Image
                                                    source={TAROT_IMAGES[card.id]}
                                                    style={styles.cardImage}
                                                />
                                            ) : (
                                                <View style={styles.cardFallback}>
                                                    <Text style={styles.cardFallbackText}>
                                                        {card.name}
                                                    </Text>
                                                </View>
                                            )}
                                        </Animated.View>
                                    </Animated.View>
                                )}
                            </View>
                        </View>
                    )
                })}
            </View>

            <View style={styles.deckArea}>
                {phase !== 'done' ? (
                    <>
                        {phase === 'drawing' && (
                            <Animated.Text
                                style={[
                                    styles.targetPositionText,
                                    { transform: [{ scale: textScale }] },
                                ]}>
                                Вытягиваем: {currentPositionName}
                            </Animated.Text>
                        )}

                        <Text style={styles.hintText}>{hintMsg}</Text>

                        <View style={styles.deckWrapper} {...panResponder.panHandlers}>
                            {phase === 'drawing' && (
                                <Animated.View
                                    style={[
                                        styles.energyAura,
                                        { transform: [{ scale: auraScale }], opacity: auraOpacity },
                                    ]}
                                />
                            )}

                            {/* АНИМАЦИЯ ТАСОВАНИЯ: Теневые разлетающиеся карты (видны только при shuffling) */}
                            {phase === 'shuffling' && (
                                <>
                                    <Animated.View
                                        style={[
                                            styles.shufflingCard,
                                            {
                                                transform: [
                                                    { translateX: shuffleX1 },
                                                    { rotateZ: shuffleRotate1 },
                                                ],
                                            },
                                        ]}>
                                        {renderCardBack()}
                                    </Animated.View>
                                    <Animated.View
                                        style={[
                                            styles.shufflingCard,
                                            {
                                                transform: [
                                                    { translateX: shuffleX2 },
                                                    { rotateZ: shuffleRotate2 },
                                                ],
                                            },
                                        ]}>
                                        {renderCardBack()}
                                    </Animated.View>
                                    <Animated.View
                                        style={[
                                            styles.shufflingCard,
                                            {
                                                transform: [
                                                    { translateY: shuffleY3 },
                                                    { rotateZ: shuffleRotate3 },
                                                ],
                                            },
                                        ]}>
                                        {renderCardBack()}
                                    </Animated.View>
                                </>
                            )}

                            {/* Главная колода по центру */}
                            <View style={{ zIndex: 5 }}>{renderCardBack()}</View>
                        </View>
                    </>
                ) : (
                    <TouchableOpacity style={styles.mainButton} onPress={handleFinish}>
                        <Text style={styles.mainButtonText}>Узнать ответ Вселенной</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },

    slotsContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 20,
        zIndex: 10,
    },
    slotWrapper: { alignItems: 'center', width: '45%', marginBottom: 16 },
    slotText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        textAlign: 'center',
        height: 30,
    },
    slotBorder: {
        width: 108,
        height: 168,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    flyingCard: { position: 'absolute', width: 108, height: 168 },
    deckPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1A1A2A',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
    },
    cardFace: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    cardBackAbsolute: { position: 'absolute', top: 0, left: 0 },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cardFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 12,
    },
    cardFallbackText: { color: COLORS.primary, fontSize: 12, textAlign: 'center', padding: 4 },

    deckArea: { height: 320, justifyContent: 'flex-start', alignItems: 'center', zIndex: 1 },
    targetPositionText: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    hintText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    deckWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    energyAura: {
        position: 'absolute',
        width: 150,
        height: 220,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 10,
    },

    mainDeckImage: { width: 130, height: 200, borderRadius: 12, resizeMode: 'cover' },
    mainDeckPlaceholder: {
        width: 130,
        height: 200,
        backgroundColor: '#1A1A2A',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
    },

    // Добавлен стиль для анимируемых карт при тасовании
    shufflingCard: { position: 'absolute', zIndex: 1 },

    mainButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 40,
    },
    mainButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
})
