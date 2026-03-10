import React, { useEffect, useState, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { TarotApi } from '../api/tarot.api'
import { CardInputDto } from '../types/dto'
import { TAROT_IMAGES } from '../constants/tarotImages'
import { COLORS } from '../constants/theme'

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>
type ResultScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Result'>

const MOCK_CARD_DESCRIPTION = `Эта карта несет в себе мощный поток первозданной энергии, символизируя глубокие трансформации и скрытые потенциалы вашего подсознания. В классической традиции Таро она указывает на необходимость прислушаться к своей интуиции и обратить внимание на знаки, которые посылает Вселенная. 

В прямом положении она говорит о ясности намерений, прорыве в застоявшихся делах и внезапном озарении, которое поможет решить давнюю проблему. Это архетип силы воли, направленной в созидательное русло. Вы находитесь на пороге важного открытия, которое потребует от вас смелости и готовности выйти из зоны комфорта.

Энергия этой карты призывает к балансу: не торопите события, но и не упускайте открывающиеся возможности. Обратите внимание на свое окружение — возможно, нужный ответ уже находится рядом с вами, просто вы его не замечаете из-за повседневной суеты. Доверьтесь потоку, позвольте событиям развиваться естественным путем, и вы увидите, как преграды рушатся, уступая место новым, светлым перспективам. Ваша внутренняя мудрость — ваш лучший компас на данном этапе пути.`

export const ResultScreen = () => {
    const route = useRoute<ResultScreenRouteProp>()
    const navigation = useNavigation<ResultScreenNavProp>()
    const { layoutType, drawSource, cards, question } = route.params // <-- добавили question

    const [isLoading, setIsLoading] = useState(true)
    const [aiResponse, setAiResponse] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [needsAd, setNeedsAd] = useState(false)

    const [selectedCardForModal, setSelectedCardForModal] = useState<CardInputDto | null>(null)

    const fetchInterpretation = useCallback(
        async (isAdWatched: boolean = false) => {
            setIsLoading(true)
            setErrorMessage(null)
            setNeedsAd(false)

            try {
                const questionMap: Record<string, string> = {
                    daily: 'Что принесет мне этот день?',
                    chronological: 'Как развивается моя ситуация (прошлое, настоящее, будущее)?',
                    partner: 'Что происходит в наших отношениях?',
                    reflective: 'Помоги мне разобраться в себе и моем внутреннем конфликте.',
                }
                const finalQuestionToAI = question
                    ? question
                    : questionMap[layoutType] || 'Сделай расклад по этим картам.'

                const response = await TarotApi.interpretReading({
                    question: finalQuestionToAI, // <-- передаем финальный вопрос
                    layoutType,
                    drawSource,
                    cards,
                    isAd: isAdWatched,
                })

                setAiResponse(response.aiResponse)
            } catch (error: any) {
                const status = error.response?.status
                const msg =
                    error.response?.data?.message ||
                    'Не удалось связаться с космосом. Попробуйте позже.'

                setErrorMessage(msg)

                if (status === 403) {
                    setNeedsAd(true)
                }
            } finally {
                setIsLoading(false)
            }
        },
        [layoutType, drawSource, cards],
    )

    useEffect(() => {
        fetchInterpretation(false)
    }, [fetchInterpretation])

    const handleWatchAd = () => {
        setIsLoading(true)
        setErrorMessage(null)
        setTimeout(() => {
            fetchInterpretation(true)
        }, 2000)
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Home')}
                    style={styles.homeButton}
                    disabled={isLoading}>
                    <Ionicons
                        name="home-outline"
                        size={24}
                        color={isLoading ? '#555' : COLORS.primary}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ответ Вселенной</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.fixedCardsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsScrollContent}>
                    {cards.map((card, index) => (
                        <TouchableOpacity
                            key={`${card.id}_${index}`}
                            style={styles.miniCardWrapper}
                            onPress={() => setSelectedCardForModal(card)}
                            activeOpacity={0.7}>
                            {/* numberOfLines={2} позволяет тексту переноситься на вторую строку */}
                            <Text style={styles.miniCardPosition} numberOfLines={2}>
                                {card.position}
                            </Text>

                            <View style={styles.miniCardImageBorder}>
                                {TAROT_IMAGES[card.id] ? (
                                    <Image
                                        source={TAROT_IMAGES[card.id]}
                                        style={[
                                            styles.miniCardImage,
                                            card.isReversed
                                                ? { transform: [{ rotateZ: '180deg' }] }
                                                : {},
                                        ]}
                                    />
                                ) : (
                                    <View style={styles.miniCardFallback}>
                                        <Text style={styles.miniCardFallbackText} numberOfLines={2}>
                                            {card.name}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.miniCardName} numberOfLines={2}>
                                {card.isReversed ? '🔄 ' : ''}
                                {card.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.responseScrollContent}
                showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Таролог читает ваши карты...</Text>
                        <Text style={styles.loadingSubtext}>Это может занять до 15 секунд</Text>
                    </View>
                ) : null}

                {errorMessage && !isLoading ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                        <Text style={styles.errorText}>{errorMessage}</Text>

                        {needsAd ? (
                            <TouchableOpacity style={styles.adButton} onPress={handleWatchAd}>
                                <Ionicons
                                    name="play-circle-outline"
                                    size={24}
                                    color={COLORS.primary}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.adButtonText}>Смотреть рекламу</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : null}

                {aiResponse && !isLoading ? (
                    <View style={styles.responseContainer}>
                        <Text style={styles.responseText}>{aiResponse}</Text>
                    </View>
                ) : null}
            </ScrollView>

            {!isLoading ? (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.mainButtonText}>
                            {errorMessage && !needsAd ? 'Вернуться на Главную' : 'Завершить сеанс'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <Modal visible={!!selectedCardForModal} animationType="fade" transparent={true}>
                {selectedCardForModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Базовая энергия карты</Text>
                                <TouchableOpacity onPress={() => setSelectedCardForModal(null)}>
                                    <Ionicons name="close" size={28} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.modalScrollContent}>
                                <View style={styles.modalImageContainer}>
                                    {TAROT_IMAGES[selectedCardForModal.id] ? (
                                        <Image
                                            source={TAROT_IMAGES[selectedCardForModal.id]}
                                            style={[
                                                styles.modalLargeImage,
                                                selectedCardForModal.isReversed
                                                    ? { transform: [{ rotateZ: '180deg' }] }
                                                    : {},
                                            ]}
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.modalLargeImage,
                                                styles.modalFallbackLarge,
                                            ]}>
                                            <Text style={styles.modalFallbackTextLarge}>
                                                {selectedCardForModal.name}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.modalCardTitle}>
                                    {selectedCardForModal.name}{' '}
                                    {selectedCardForModal.isReversed ? '(Перевернутая)' : ''}
                                </Text>
                                <Text style={styles.modalCardPosition}>
                                    В позиции: {selectedCardForModal.position}
                                </Text>

                                <View style={styles.divider} />

                                <Text style={styles.modalDescriptionText}>
                                    {selectedCardForModal.isReversed && (
                                        <Text style={styles.reversedWarning}>
                                            ⚠️ В перевернутом положении энергия карты заблокирована,
                                            ослаблена или искажена.{'\n\n'}
                                        </Text>
                                    )}
                                    {MOCK_CARD_DESCRIPTION}
                                </Text>
                            </ScrollView>
                        </View>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A2A',
    },
    homeButton: { padding: 8 },
    headerTitle: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
    headerSpacer: { width: 40 },

    fixedCardsContainer: {
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A2A',
        paddingVertical: 12,
    },

    // Добавлены flexGrow: 1 и justifyContent: 'center' для центрирования
    cardsScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
        alignItems: 'flex-end',
        flexGrow: 1,
        justifyContent: 'center',
    },

    // Wrapper немного расширен (было 72, стало 86), чтобы вместить перенос длинных слов
    miniCardWrapper: { alignItems: 'center', width: 86 },

    // Добавлена minHeight, чтобы картинки не прыгали вверх-вниз из-за разного кол-ва строк в тексте
    miniCardPosition: {
        color: COLORS.textSecondary,
        fontSize: 9,
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign: 'center',
        minHeight: 24,
        justifyContent: 'flex-end',
    },

    // Сама рамка карты осталась прежнего размера (64x100), чтобы не ломать пропорции картинок
    miniCardImageBorder: {
        width: 64,
        height: 100,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#111',
        marginBottom: 6,
    },
    miniCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    miniCardFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 4 },
    miniCardFallbackText: { color: COLORS.primary, fontSize: 8, textAlign: 'center' },

    // Добавлена minHeight для нижнего текста
    miniCardName: {
        color: COLORS.primary,
        fontSize: 10,
        textAlign: 'center',
        fontWeight: 'bold',
        minHeight: 28,
    },

    responseScrollContent: { padding: 20, paddingBottom: 40 },

    centerContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    loadingText: { color: COLORS.primary, fontSize: 18, marginTop: 20, fontWeight: '500' },
    loadingSubtext: { color: COLORS.textSecondary, fontSize: 14, marginTop: 8, fontStyle: 'italic' },

    errorContainer: {
        alignItems: 'center',
        marginTop: 40,
        padding: 20,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    errorText: {
        color: COLORS.textMain,
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 16,
        lineHeight: 24,
    },
    adButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 8,
    },
    adButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    responseContainer: {
        backgroundColor: COLORS.modalBackground,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    responseText: { color: '#E0E0E0', fontSize: 16, lineHeight: 26 },

    footer: { padding: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderColor: '#1A1A2A' },
    mainButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        width: '100%',
    },
    mainButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: COLORS.modalBackground,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
    modalScrollContent: { alignItems: 'center', paddingBottom: 20 },

    modalImageContainer: {
        width: 160,
        height: 260,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#111',
    },
    modalLargeImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    modalFallbackLarge: { justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalFallbackTextLarge: { color: COLORS.primary, fontSize: 16, textAlign: 'center' },

    modalCardTitle: {
        color: COLORS.textMain,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalCardPosition: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    divider: {
        width: '40%',
        height: 1,
        backgroundColor: COLORS.primary,
        marginBottom: 16,
        opacity: 0.5,
    },

    modalDescriptionText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24, textAlign: 'justify' },
    reversedWarning: { color: '#FF6B6B', fontWeight: 'bold' },
})
