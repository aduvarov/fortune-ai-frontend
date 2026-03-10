import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { LayoutType, DrawSource } from '../types/dto'
import { COLORS } from '../constants/theme'
import { useSettingsStore } from '../store/useSettingsStore'

type SetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetupReading'>
type SetupScreenRouteProp = RouteProp<RootStackParamList, 'SetupReading'>

const LAYOUT_OPTIONS: { id: LayoutType; title: string; desc: string; icon: any; fullDesc?: string }[] = [
    {
        id: 'daily',
        title: 'Карта Дня',
        desc: 'На сегодня',
        icon: 'sunny-outline',
        fullDesc: 'Одна карта, которая покажет главную энергию грядущего дня, даст совет или предупредит о возможном вызове.',
    },
    {
        id: 'chronological',
        title: 'Прошлое, Настоящее, Будущее',
        desc: 'Классический расклад на ситуацию',
        icon: 'hourglass-outline',
        fullDesc: 'Классический расклад из трех карт. Помогает проанализировать развитие ситуации во времени и увидеть возможный исход.',
    },
    {
        id: 'partner',
        title: 'Отношения',
        desc: 'Ты, партнер и то, что между вами',
        icon: 'heart-half-outline',
        fullDesc: 'Расклад из трех карт для анализа отношений. Показывает ваши чувства, чувства партнера и перспективу союза.',
    },
    {
        id: 'reflective',
        title: 'Внутренний Конфликт',
        desc: 'Глубокий анализ подсознания (4 карты)',
        icon: 'eye-outline',
        fullDesc: 'Глубокий анализ из 4 карт. Помогает разобраться в сложных внутренних противоречиях, скрытых мотивах и страхах.',
    },
]

const SOURCE_OPTIONS: { id: DrawSource; title: string; icon: any; fullDesc: string }[] = [
    {
        id: 'app',
        title: 'Виртуальная',
        icon: 'phone-portrait-outline',
        fullDesc: 'Виртуальная колода. Карты будут перемешаны и вытянуты случайным образом прямо на экране вашего устройства.',
    },
    {
        id: 'physical',
        title: 'Физическая',
        icon: 'hand-right-outline',
        fullDesc: 'Если у вас есть настоящая колода Таро, вы можете самостоятельно вытянуть карты, а затем выбрать их здесь для интерпретации ИИ.',
    },
]

export const SetupReadingScreen = () => {
    const navigation = useNavigation<SetupScreenNavigationProp>()
    const route = useRoute<SetupScreenRouteProp>()
    const { defaultDrawSource } = useSettingsStore()

    const [selectedLayout, setSelectedLayout] = useState<LayoutType | null>(null)
    const [selectedSource, setSelectedSource] = useState<DrawSource | null>(defaultDrawSource)
    const [question, setQuestion] = useState('')

    // Модалка для Раскладов
    const [layoutModalVisible, setLayoutModalVisible] = useState(false)
    const [previewLayoutId, setPreviewLayoutId] = useState<LayoutType | null>(null)
    const [tempQuestion, setTempQuestion] = useState('') // Временный вопрос для модалки

    // Модалка для Колоды
    const [sourceModalVisible, setSourceModalVisible] = useState(false)
    const [previewSourceId, setPreviewSourceId] = useState<DrawSource | null>(null)

    // Если пришли с HomeScreen с уже выбранным раскладом — сразу открываем модалку
    useEffect(() => {
        const initialLayout = route.params?.initialLayout
        if (initialLayout) {
            setPreviewLayoutId(initialLayout)
            setTempQuestion('')
            setLayoutModalVisible(true)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleContinue = () => {
        if (!selectedLayout || !selectedSource) return

        const finalQuestion = selectedLayout === 'daily' ? undefined : question.trim()

        if (selectedSource === 'app') {
            navigation.navigate('VirtualTable', {
                layoutType: selectedLayout,
                question: finalQuestion,
            })
        } else {
            navigation.navigate('PhysicalInput', {
                layoutType: selectedLayout,
                question: finalQuestion,
            })
        }
    }

    const openLayoutModal = (id: LayoutType) => {
        setPreviewLayoutId(id)
        setTempQuestion(question) // Подтягиваем уже введенный вопрос
        setLayoutModalVisible(true)
    }

    const confirmLayout = () => {
        if (previewLayoutId) {
            setSelectedLayout(previewLayoutId)
            setQuestion(tempQuestion)
        }
        setLayoutModalVisible(false)
    }

    const openSourceModal = (id: DrawSource) => {
        setPreviewSourceId(id)
        setSourceModalVisible(true)
    }

    const confirmSource = () => {
        if (previewSourceId) {
            setSelectedSource(previewSourceId)
        }
        setSourceModalVisible(false)
    }

    const previewLayoutData = LAYOUT_OPTIONS.find(l => l.id === previewLayoutId)
    const previewSourceData = SOURCE_OPTIONS.find(s => s.id === previewSourceId)

    const isContinueEnabled = selectedLayout !== null && selectedSource !== null

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    <Text style={styles.backText}>Назад</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                
                {/* --- ВЫБОР РАСКЛАДА --- */}
                <Text style={styles.sectionTitle}>Выбери Расклад</Text>
                <View style={styles.optionsGrid}>
                    {LAYOUT_OPTIONS.map(option => {
                        const isSelected = selectedLayout === option.id
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardActive
                                ]}
                                onPress={() => openLayoutModal(option.id)}
                                activeOpacity={0.7}>
                                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                    <Ionicons
                                        name={option.icon}
                                        size={28}
                                        color={isSelected ? COLORS.background : COLORS.primary}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.optionTitle,
                                        isSelected && styles.textSelected,
                                    ]}
                                    numberOfLines={2}>
                                    {option.title}
                                </Text>
                                <Text
                                    style={[
                                        styles.optionDesc,
                                        isSelected && styles.textSelected,
                                    ]}
                                    numberOfLines={2}>
                                    {option.desc}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Если выбран не Карта дня, показываем превью вопроса на главном угле */}
                {selectedLayout && selectedLayout !== 'daily' && (
                    <View style={styles.activeQuestionCard}>
                        <Text style={styles.activeQuestionLabel}>Ваш вопрос:</Text>
                        <Text style={styles.activeQuestionText}>
                            {question || "Не задан (Будет общий расклад)"}
                        </Text>
                    </View>
                )}

                {/* --- ВЫБОР КОЛОДЫ --- */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Колода</Text>
                <View style={styles.sourceGrid}>
                    {SOURCE_OPTIONS.map((option) => {
                        const isSelected = selectedSource === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.sourceCard,
                                    isSelected && styles.optionCardActive,
                                ]}
                                onPress={() => openSourceModal(option.id)}
                                activeOpacity={0.7}>
                                <Ionicons
                                    name={option.icon}
                                    size={24}
                                    color={isSelected ? COLORS.background : COLORS.primary}
                                    style={styles.sourceIcon}
                                />
                                <Text
                                    style={[
                                        styles.sourceTitle,
                                        isSelected && styles.textSelected,
                                    ]}>
                                    {option.title}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.continueButton, !isContinueEnabled && styles.continueButtonDisabled]} 
                    onPress={handleContinue}
                    disabled={!isContinueEnabled}>
                    <Text style={[styles.continueButtonText, !isContinueEnabled && styles.continueButtonTextDisabled]}>
                        Продолжить
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={isContinueEnabled ? COLORS.background : "rgba(255,255,255,0.3)"} />
                </TouchableOpacity>
            </View>

            {/* --- МОДАЛКА ВЫБРА РАСКЛАДА --- */}
            <Modal
                transparent={true}
                visible={layoutModalVisible}
                animationType="fade"
                onRequestClose={() => setLayoutModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        {previewLayoutData && (
                            <>
                                <View style={styles.modalIconContainer}>
                                    <Ionicons name={previewLayoutData.icon} size={40} color={COLORS.primary} />
                                </View>
                                <Text style={styles.modalTitle}>{previewLayoutData.title}</Text>
                                <Text style={styles.modalDesc}>{previewLayoutData.fullDesc}</Text>

                                {previewLayoutId !== 'daily' && (
                                    <View style={styles.modalInputSection}>
                                        <Text style={styles.modalInputLabel}>Ваш вопрос Вселенной (необязательно)</Text>
                                        <TextInput
                                            style={styles.modalTextInput}
                                            placeholder="Например: Как пройдет встреча завтра?"
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={tempQuestion}
                                            onChangeText={setTempQuestion}
                                            multiline
                                            maxLength={150}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                )}

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLayoutModalVisible(false)}>
                                        <Text style={styles.modalCancelText}>Отмена</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalApproveBtn} onPress={confirmLayout}>
                                        <Text style={styles.modalApproveText}>Выбрать</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* --- МОДАЛКА ВЫБОРА КОЛОДЫ --- */}
            <Modal
                transparent={true}
                visible={sourceModalVisible}
                animationType="fade"
                onRequestClose={() => setSourceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {previewSourceData && (
                            <>
                                <View style={styles.modalIconContainer}>
                                    <Ionicons name={previewSourceData.icon} size={40} color={COLORS.primary} />
                                </View>
                                <Text style={styles.modalTitle}>{previewSourceData.title}</Text>
                                <Text style={styles.modalDesc}>{previewSourceData.fullDesc}</Text>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSourceModalVisible(false)}>
                                        <Text style={styles.modalCancelText}>Отмена</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalApproveBtn} onPress={confirmSource}>
                                        <Text style={styles.modalApproveText}>Выбрать</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: COLORS.primary, fontSize: 16, marginLeft: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

    sectionTitle: {
        color: COLORS.textMain,
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    
    // Сетка
    optionsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        gap: 12 
    },
    optionCard: {
        width: '48%',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        borderRadius: 16,
        padding: 16,
    },
    optionCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainerSelected: {
        backgroundColor: COLORS.whiteMedium,
    },
    optionTitle: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
    optionDesc: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 16 },
    textSelected: { color: COLORS.background },

    activeQuestionCard: {
        marginTop: 16,
        padding: 12,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    activeQuestionLabel: { color: COLORS.primary, fontSize: 13, marginBottom: 4 },
    activeQuestionText: { color: COLORS.textMain, fontSize: 15, fontStyle: 'italic' },

    sourceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    sourceCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        borderRadius: 16,
        padding: 14,
        paddingVertical: 18,
    },
    sourceIcon: { marginRight: 8 },
    sourceTitle: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },

    footer: {
        padding: 16,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 30,
    },
    continueButtonDisabled: {
        backgroundColor: COLORS.whiteLight,
    },
    continueButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 8,
    },
    continueButtonTextDisabled: {
        color: COLORS.whiteMedium,
    },

    // Модалка
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.modalBackground,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    modalDesc: { color: '#E0E0E0', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
    
    modalInputSection: { width: '100%', marginBottom: 20 },
    modalInputLabel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, marginLeft: 4 },
    modalTextInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: COLORS.textMain,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        minHeight: 100,
    },

    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: COLORS.whiteLight,
        alignItems: 'center',
    },
    modalCancelText: { color: COLORS.textMain, fontSize: 16, fontWeight: '600' },
    modalApproveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    modalApproveText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
})
