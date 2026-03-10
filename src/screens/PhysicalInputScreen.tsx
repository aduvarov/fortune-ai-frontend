import React, { useState, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    FlatList,
    TextInput,
    Switch,
    Image,
    Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { CardInputDto } from '../types/dto'
import { TAROT_DECK, LAYOUT_CONFIG, TarotCardDef } from '../constants/tarot'
import { TAROT_IMAGES } from '../constants/tarotImages'

type PhysicalInputRouteProp = RouteProp<RootStackParamList, 'PhysicalInput'>
type PhysicalInputNavProp = NativeStackNavigationProp<RootStackParamList, 'PhysicalInput'>

const { width } = Dimensions.get('window')

export const PhysicalInputScreen = () => {
    const route = useRoute<PhysicalInputRouteProp>()
    const navigation = useNavigation<PhysicalInputNavProp>()
    const layoutType = route.params.layoutType as keyof typeof LAYOUT_CONFIG
    const positions = LAYOUT_CONFIG[layoutType]

    const [selectedCards, setSelectedCards] = useState<Record<string, CardInputDto>>({})

    // Стейт Модалки
    const [activePositionId, setActivePositionId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isReversedToggle, setIsReversedToggle] = useState(false)

    // Умный поиск с маппингом цифр в слова
    const filteredDeck = useMemo(() => {
        let normalizedQuery = searchQuery.toLowerCase()

        // Переводим цифры в слова для Младших Арканов
        normalizedQuery = normalizedQuery.replace(/10/g, 'десятка')
        normalizedQuery = normalizedQuery.replace(/1/g, 'туз')
        normalizedQuery = normalizedQuery.replace(/2/g, 'двойка')
        normalizedQuery = normalizedQuery.replace(/3/g, 'тройка')
        normalizedQuery = normalizedQuery.replace(/4/g, 'четверка')
        normalizedQuery = normalizedQuery.replace(/5/g, 'пятерка')
        normalizedQuery = normalizedQuery.replace(/6/g, 'шестерка')
        normalizedQuery = normalizedQuery.replace(/7/g, 'семерка')
        normalizedQuery = normalizedQuery.replace(/8/g, 'восьмерка')
        normalizedQuery = normalizedQuery.replace(/9/g, 'девятка')

        // Разбиваем запрос на слова, чтобы "9 пента" работало
        const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0)
        const alreadySelectedIds = Object.values(selectedCards).map(c => c.id)

        return TAROT_DECK.filter(card => {
            const cardNameLower = card.name.toLowerCase()
            // Карта должна содержать все введенные кусочки слов
            const matchesSearch = searchTerms.every(term => cardNameLower.includes(term))
            // И не должна быть уже выбрана в другой слот
            const isAlreadySelected =
                alreadySelectedIds.includes(card.id) &&
                selectedCards[activePositionId || '']?.id !== card.id

            return matchesSearch && !isAlreadySelected
        })
    }, [searchQuery, selectedCards, activePositionId])

    const handleSelectCard = (card: TarotCardDef) => {
        if (activePositionId) {
            const positionTitle = positions.find(p => p.id === activePositionId)?.title || ''
            setSelectedCards(prev => ({
                ...prev,
                [activePositionId]: {
                    id: card.id,
                    name: card.name,
                    position: positionTitle,
                    isReversed: isReversedToggle,
                },
            }))
            closeModal()
        }
    }

    const closeModal = () => {
        setActivePositionId(null)
        setSearchQuery('')
        setIsReversedToggle(false)
    }

    const isReady = Object.keys(selectedCards).length === positions.length

    const handleInterpret = () => {
        const finalCardsArray = positions.map(p => selectedCards[p.id])
        navigation.navigate('Result', {
            layoutType,
            drawSource: 'physical',
            cards: finalCardsArray,
        })
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#D4AF37" />
                    <Text style={styles.headerTitle}>Своя Колода</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.instructions}>
                    Положите вытянутые карты в соответствующие слоты.
                </Text>

                {/* Сетка слотов (Grid) */}
                <View style={styles.slotsContainer}>
                    {positions.map(pos => {
                        const card = selectedCards[pos.id]

                        return (
                            <View key={pos.id} style={styles.slotWrapper}>
                                <Text style={styles.slotPositionTitle}>{pos.title}</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.slotBorder,
                                        card ? styles.slotBorderFilled : null,
                                    ]}
                                    onPress={() => setActivePositionId(pos.id)}
                                    activeOpacity={0.8}>
                                    {card ? (
                                        <Image
                                            source={TAROT_IMAGES[card.id]}
                                            style={[
                                                styles.cardImage,
                                                card.isReversed
                                                    ? { transform: [{ rotateZ: '180deg' }] }
                                                    : {},
                                            ]}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="add-circle-outline"
                                            size={40}
                                            color="#333"
                                        />
                                    )}
                                </TouchableOpacity>

                                {card && (
                                    <Text style={styles.slotCardName} numberOfLines={2}>
                                        {card.name} {card.isReversed ? '(Пер.)' : ''}
                                    </Text>
                                )}
                            </View>
                        )
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.mainButton, !isReady && styles.mainButtonDisabled]}
                    onPress={handleInterpret}
                    disabled={!isReady}>
                    <Text
                        style={[styles.mainButtonText, !isReady && styles.mainButtonTextDisabled]}>
                        Расшифровать
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Модальное окно выбора карты (теперь с картинками) */}
            <Modal visible={!!activePositionId} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Поиск карты</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={28} color="#D4AF37" />
                            </TouchableOpacity>
                        </View>

                        {/* Блок управления: Поиск и переключатель */}
                        <View style={styles.controlsContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Например: 9 пента, туз..."
                                placeholderTextColor="#8A8A9E"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true} // Автоматически открываем клавиатуру
                            />

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Перевернута?</Text>
                                <Switch
                                    value={isReversedToggle}
                                    onValueChange={setIsReversedToggle}
                                    trackColor={{ false: '#333', true: '#D4AF37' }}
                                    thumbColor={isReversedToggle ? '#FFF' : '#8A8A9E'}
                                />
                            </View>
                        </View>

                        {/* Сетка карт */}
                        <FlatList
                            data={filteredDeck}
                            keyExtractor={item => item.id}
                            numColumns={3} // 3 колонки для удобного просмотра
                            showsVerticalScrollIndicator={false}
                            columnWrapperStyle={styles.gridRow}
                            keyboardShouldPersistTaps="handled" // Чтобы клавиатура не мешала тапу по карте
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.deckItemWrapper}
                                    onPress={() => handleSelectCard(item)}>
                                    <View style={styles.modalCardBorder}>
                                        {TAROT_IMAGES[item.id] ? (
                                            <Image
                                                source={TAROT_IMAGES[item.id]}
                                                style={[
                                                    styles.modalCardImage,
                                                    isReversedToggle
                                                        ? { transform: [{ rotateZ: '180deg' }] }
                                                        : {},
                                                ]}
                                            />
                                        ) : (
                                            <Text style={styles.modalFallbackText}>
                                                {item.name}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.deckItemText} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
    content: { padding: 20 },
    instructions: {
        color: '#8A8A9E',
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    // Сетка на главном экране
    slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    slotWrapper: { alignItems: 'center', width: '45%', marginBottom: 16 },
    slotPositionTitle: {
        color: '#8A8A9E',
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
        backgroundColor: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
    },
    slotBorderFilled: { borderColor: '#D4AF37', borderStyle: 'solid' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    slotCardName: { color: '#D4AF37', fontSize: 12, textAlign: 'center', marginTop: 8, height: 32 },

    footer: { padding: 20, borderTopWidth: 1, borderColor: '#1A1A2A' },
    mainButton: {
        backgroundColor: '#D4AF37',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    mainButtonDisabled: { backgroundColor: '#333' },
    mainButtonText: {
        color: '#0A0A1A',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mainButtonTextDisabled: { color: '#555' },

    // Стили модалки
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#111122',
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },

    controlsContainer: { marginBottom: 16 },
    searchInput: {
        backgroundColor: '#0A0A1A',
        color: '#FFF',
        padding: 14,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 12,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0A0A1A',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    switchLabel: { color: '#FFF', fontSize: 14 },

    // Сетка в модалке (3 колонки)
    gridRow: { justifyContent: 'space-between', marginBottom: 20 },
    deckItemWrapper: { width: (width - 40 - 24) / 3, alignItems: 'center' }, // width - padding экрана - gap
    modalCardBorder: {
        width: '100%',
        aspectRatio: 0.65,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
        marginBottom: 6,
        backgroundColor: '#0A0A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    modalFallbackText: { color: '#D4AF37', fontSize: 10, textAlign: 'center' },
    deckItemText: { color: '#8A8A9E', fontSize: 11, textAlign: 'center' },
})
