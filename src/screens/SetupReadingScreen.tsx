import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { DrawSource, LayoutType } from '../types/dto'
import { COLORS } from '../constants/theme'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'

type SetupScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SetupReading'
>
type SetupScreenRouteProp = RouteProp<RootStackParamList, 'SetupReading'>

// Данные для блока выбора расклада.
const LAYOUT_OPTIONS: {
    id: LayoutType
    title: string
    desc: string
    icon: keyof typeof Ionicons.glyphMap
    fullDesc: string
    cardsCount: number
    ritualLabel: string
}[] = [
        {
            id: 'daily',
            title: 'Карты дня',
            desc: 'Быстрое послание на сегодня',
            icon: 'sunny-outline',
            fullDesc:
                'Мягкий ежедневный ритуал, чтобы поймать главную энергию дня, увидеть подсказку и заметить внутренний настрой.',
            cardsCount: 3,
            ritualLabel: 'короткий ритуал',
        },
        {
            id: 'chronological',
            title: 'Прошлое · Настоящее · Будущее',
            desc: 'Классический расклад на развитие ситуации',
            icon: 'hourglass-outline',
            fullDesc:
                'Помогает увидеть, откуда пришла ситуация, где ты находишься сейчас и в каком направлении ведёт текущая динамика.',
            cardsCount: 3,
            ritualLabel: 'сюжетный расклад',
        },
        {
            id: 'partner',
            title: 'Отношения',
            desc: 'Ты, партнёр и пространство между вами',
            icon: 'heart-half-outline',
            fullDesc:
                'Подходит, когда нужно уловить эмоциональный баланс, ожидания друг друга и реальное состояние связи между вами.',
            cardsCount: 3,
            ritualLabel: 'эмоциональный расклад',
        },
        {
            id: 'reflective',
            title: 'Внутренний Конфликт',
            desc: 'Глубокий взгляд на скрытые мотивы',
            icon: 'eye-outline',
            fullDesc:
                'Более медленный и глубокий ритуал для внутренних противоречий, страхов, подавленных желаний и поиска честной опоры.',
            cardsCount: 4,
            ritualLabel: 'глубокий расклад',
        },
    ]

// Данные для блока выбора колоды.
const SOURCE_OPTIONS: {
    id: DrawSource
    title: string
    icon: keyof typeof Ionicons.glyphMap
    shortDesc: string
    fullDesc: string
}[] = [
        {
            id: 'app',
            title: 'Виртуальная колода',
            icon: 'phone-portrait-outline',
            shortDesc: 'Карты вытянутся прямо на экране',
            fullDesc:
                'Если хочется быстро войти в ритуал и доверить выбор карт приложению.',
        },
        {
            id: 'physical',
            title: 'Своя колода',
            icon: 'hand-right-outline',
            shortDesc: 'Вытянешь карты сам и укажешь их вручную',
            fullDesc:
                'Если у тебя уже есть физическая колода и хочется сохранить своё прикосновение к раскладу.',
        },
    ]

// Порядок верхней step-навигации и якорей скролла.
const STEP_ITEMS = [
    { id: 'source', label: 'Колода' },
    { id: 'layout', label: 'Расклад' },
    { id: 'question', label: 'Фокус' },
] as const

export const SetupReadingScreen = () => {
    const navigation = useNavigation<SetupScreenNavigationProp>()
    const route = useRoute<SetupScreenRouteProp>()
    const { defaultDrawSource } = useSettingsStore()
    const energyBalance = useAuthStore(state => state.energyBalance)

    // Ref'ы для программной прокрутки между смысловыми секциями экрана.
    const scrollViewRef = useRef<ScrollView>(null)
    const layoutSectionY = useRef(0)
    const sourceSectionY = useRef(0)
    const questionSectionY = useRef(0)

    // Основное состояние ритуала, которое собирает экран.
    const [selectedLayout, setSelectedLayout] = useState<LayoutType | null>(null)
    const [selectedSource, setSelectedSource] =
        useState<DrawSource | null>(defaultDrawSource)
    const [question, setQuestion] = useState('')

    useEffect(() => {
        if (route.params?.initialLayout) {
            setSelectedLayout(route.params.initialLayout)
        }
    }, [route.params?.initialLayout])

    // Вычисляем активные данные для hero и summary из текущего выбора.
    const selectedLayoutData = useMemo(
        () => LAYOUT_OPTIONS.find(option => option.id === selectedLayout) ?? null,
        [selectedLayout],
    )
    const selectedSourceData = useMemo(
        () => SOURCE_OPTIONS.find(option => option.id === selectedSource) ?? null,
        [selectedSource],
    )
    const selectedEnergyCost = selectedLayoutData
        ? selectedLayoutData.cardsCount * 10
        : null
    const missingEnergy =
        selectedEnergyCost !== null
            ? Math.max(selectedEnergyCost - (energyBalance ?? 0), 0)
            : null
    const hasEnoughEnergy =
        selectedEnergyCost !== null ? (energyBalance ?? 0) >= selectedEnergyCost : false

    const handleContinue = () => {
        if (!selectedLayout || !selectedSource) return

        if (!hasEnoughEnergy) {
            Alert.alert(
                'Недостаточно энергии',
                selectedEnergyCost !== null
                    ? `Для этого расклада нужно ${selectedEnergyCost} энергии. Сейчас у тебя ${energyBalance ?? 0}.`
                    : 'Сначала пополни энергию, чтобы начать расклад.',
                [
                    { text: 'Позже', style: 'cancel' },
                    {
                        text: 'Пополнить',
                        onPress: () => navigation.navigate('Energy'),
                    },
                ],
            )
            return
        }

        const finalQuestion =
            selectedLayout === 'daily' ? undefined : question.trim() || undefined

        if (selectedSource === 'app') {
            navigation.navigate('VirtualTable', {
                layoutType: selectedLayout,
                question: finalQuestion,
            })
            return
        }

        navigation.navigate('PhysicalInput', {
            layoutType: selectedLayout,
            question: finalQuestion,
        })
    }

    const scrollToLayouts = () => {
        scrollViewRef.current?.scrollTo({
            y: Math.max(layoutSectionY.current - 12, 0),
            animated: true,
        })
    }

    const scrollToSection = (section: (typeof STEP_ITEMS)[number]['id']) => {
        const sectionMap = {
            layout: layoutSectionY.current,
            source: sourceSectionY.current,
            question: questionSectionY.current,
        }

        scrollViewRef.current?.scrollTo({
            y: Math.max(sectionMap[section] - 12, 0),
            animated: true,
        })
    }

    const isContinueEnabled = selectedLayout !== null && selectedSource !== null

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.ambientOrbOne} />
            <View style={styles.ambientOrbTwo} />

            {/* Верхняя навигация: кнопка назад + step-линейка с якорями. */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.headerSteps}>
                    {STEP_ITEMS.map((step, index) => {
                        const isActive =
                            (step.id === 'layout' && !!selectedLayout) ||
                            (step.id === 'source' && !!selectedSource) ||
                            (step.id === 'question' &&
                                selectedLayout !== 'daily' &&
                                question.trim().length > 0)

                        return (
                            <React.Fragment key={step.id}>
                                <TouchableOpacity
                                    style={[
                                        styles.stepPill,
                                        isActive && styles.stepPillActive,
                                    ]}
                                    onPress={() => scrollToSection(step.id)}
                                    activeOpacity={0.8}>
                                    <Text
                                        style={[
                                            styles.stepIndex,
                                            isActive && styles.stepIndexActive,
                                        ]}>
                                        {index + 1}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            isActive && styles.stepLabelActive,
                                        ]}>
                                        {step.label}
                                    </Text>
                                </TouchableOpacity>
                                {index < STEP_ITEMS.length - 1 && (
                                    <View style={styles.stepDivider} />
                                )}
                            </React.Fragment>
                        )
                    })}
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                {/* Hero-блок: атмосфера экрана и быстрый статус текущего выбора. */}
                <View style={styles.heroCard}>
                    <View style={styles.heroHalo} />
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroBadge}>
                            <Ionicons
                                name="sparkles-outline"
                                size={14}
                                color={COLORS.background}
                            />
                            <Text style={styles.heroBadgeText}>Подготовка ритуала</Text>
                        </View>
                        <View style={styles.heroGlyph}>
                            <Ionicons name="moon" size={22} color={COLORS.primary} />
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>Собери расклад под свой вопрос</Text>
                    <Text style={styles.heroSubtitle}>
                        Выбери формат чтения, способ вытягивания и, если нужно,
                        задай эмоциональный фокус для интерпретации.
                    </Text>

                    <TouchableOpacity
                        style={styles.heroBottomRow}
                        activeOpacity={0.85}
                        onPress={scrollToLayouts}>
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>
                                {selectedLayoutData?.cardsCount ?? '3-4'}
                            </Text>
                            <Text style={styles.heroStatLabel}>карты</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStatWide}>
                            <Text style={styles.heroStatWideLabel}>
                                {selectedLayoutData?.ritualLabel ?? 'выбери ритм расклада'}
                            </Text>
                            <Text style={styles.heroStatWideValue}>
                                {selectedLayoutData?.title ?? 'Расклад ещё не выбран'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Шаг 1: выбор способа вытягивания карт. */}
                <View
                    style={styles.section}
                    onLayout={event => {
                        sourceSectionY.current = event.nativeEvent.layout.y
                    }}>
                    <Text style={styles.sectionTitle}>1. Выбери колоду</Text>
                    <Text style={styles.sectionSubtitle}>
                        Сначала выбери, как именно ты хочешь вытянуть карты.
                    </Text>

                    <View style={styles.sourceList}>
                        {SOURCE_OPTIONS.map(option => {
                            const isSelected = selectedSource === option.id

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.sourceCard,
                                        isSelected && styles.sourceCardActive,
                                    ]}
                                    onPress={() => setSelectedSource(option.id)}
                                    activeOpacity={0.85}>
                                    <View style={styles.sourceTopRow}>
                                        <View style={styles.sourceHeader}>
                                            <View
                                                style={[
                                                    styles.sourceIconWrap,
                                                    isSelected &&
                                                    styles.sourceIconWrapActive,
                                                ]}>
                                                <Ionicons
                                                    name={option.icon}
                                                    size={22}
                                                    color={
                                                        isSelected
                                                            ? COLORS.background
                                                            : COLORS.primary
                                                    }
                                                />
                                            </View>
                                            <Text
                                                style={[
                                                    styles.sourceTitle,
                                                    isSelected &&
                                                    styles.sourceTitleActive,
                                                ]}>
                                                {option.title}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={
                                                isSelected
                                                    ? 'radio-button-on'
                                                    : 'radio-button-off'
                                            }
                                            size={20}
                                            color={
                                                isSelected
                                                    ? COLORS.primary
                                                    : COLORS.primaryBorder
                                            }
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.sourceShortDesc,
                                            isSelected &&
                                            styles.sourceShortDescActive,
                                        ]}>
                                        {option.shortDesc}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.sourceFullDesc,
                                            isSelected &&
                                            styles.sourceFullDescActive,
                                        ]}>
                                        {option.fullDesc}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                {/* Шаг 2: выбор типа расклада. */}
                <View
                    style={styles.section}
                    onLayout={event => {
                        layoutSectionY.current = event.nativeEvent.layout.y
                    }}>
                    <Text style={styles.sectionTitle}>2. Выбери расклад</Text>
                    <Text style={styles.sectionSubtitle}>
                        Теперь выбери форму чтения и глубину разговора.
                    </Text>

                    {LAYOUT_OPTIONS.map(option => {
                        const isSelected = selectedLayout === option.id
                        const energyCost = option.cardsCount * 10

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.layoutCard,
                                    isSelected && styles.layoutCardActive,
                                ]}
                                onPress={() => setSelectedLayout(option.id)}
                                activeOpacity={0.85}>
                                <View style={styles.layoutAccentColumn}>
                                    <View
                                        style={[
                                            styles.layoutIcon,
                                            isSelected && styles.layoutIconActive,
                                        ]}>
                                        <Ionicons
                                            name={option.icon}
                                            size={24}
                                            color={
                                                isSelected
                                                    ? COLORS.background
                                                    : COLORS.primary
                                            }
                                        />
                                    </View>
                                    <View
                                        style={[
                                            styles.layoutCardsMeta,
                                            isSelected && styles.layoutCardsMetaActive,
                                        ]}>
                                        <Text
                                            style={[
                                                styles.layoutCardsMetaText,
                                                isSelected &&
                                                styles.layoutCardsMetaTextActive,
                                            ]}>
                                            {option.cardsCount} карты
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.layoutCostMeta,
                                            isSelected && styles.layoutCostMetaActive,
                                        ]}>
                                        <Ionicons
                                            name="flash"
                                            size={14}
                                            color={
                                                isSelected
                                                    ? COLORS.primaryAccent
                                                    : COLORS.textSecondary
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.layoutCostMetaText,
                                                isSelected &&
                                                    styles.layoutCostMetaTextActive,
                                            ]}>
                                            {energyCost}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.layoutText}>
                                    <Text
                                        style={[
                                            styles.layoutMicroLabel,
                                            isSelected && styles.layoutMicroLabelActive,
                                        ]}>
                                        {option.ritualLabel}
                                    </Text>
                                    <View style={styles.layoutTitleRow}>
                                        <Text
                                            style={[
                                                styles.layoutTitle,
                                                isSelected && styles.layoutTitleActive,
                                            ]}>
                                            {option.title}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[
                                            styles.layoutDesc,
                                            isSelected && styles.layoutDescActive,
                                        ]}>
                                        {option.desc}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.layoutLongDesc,
                                            isSelected && styles.layoutLongDescActive,
                                        ]}>
                                        {option.fullDesc}
                                    </Text>
                                </View>

                                <Ionicons
                                    name={
                                        isSelected
                                            ? 'checkmark-circle'
                                            : 'ellipse-outline'
                                    }
                                    size={24}
                                    color={
                                        isSelected
                                            ? COLORS.primary
                                            : COLORS.primaryBorder
                                    }
                                />
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Шаг 3: необязательный текстовый фокус для недневных раскладов. */}
                {selectedLayout !== 'daily' && (
                    <View
                        style={styles.section}
                        onLayout={event => {
                            questionSectionY.current = event.nativeEvent.layout.y
                        }}>
                        <Text style={styles.sectionTitle}>3. Сформулируй вопрос</Text>
                        <Text style={styles.sectionSubtitle}>
                            Необязательно. Если оставишь пустым, расклад будет более
                            общим.
                        </Text>

                        <View style={styles.questionCard}>
                            <TextInput
                                style={styles.questionInput}
                                placeholder="Например: Что мне важно понять в этой ситуации?"
                                placeholderTextColor={COLORS.textSecondary}
                                value={question}
                                onChangeText={setQuestion}
                                multiline
                                maxLength={300}
                                textAlignVertical="top"
                            />
                            <View style={styles.questionFooter}>
                                <Text style={styles.questionHint}>
                                    Чем конкретнее вопрос, тем точнее акцент расклада.
                                </Text>
                                <Text style={styles.questionCount}>
                                    {question.length}/300
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Финальная сводка всего, что выбрал пользователь. */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryEyebrow}>Итог выбора</Text>
                    <Text style={styles.summaryTitle}>
                        {selectedLayoutData?.title ?? 'Расклад ещё не выбран'}
                    </Text>
                    {selectedLayoutData ? (
                        <View style={styles.summaryMetaRow}>
                            <View style={styles.summaryMetaPill}>
                                <Ionicons
                                    name={selectedLayoutData.icon}
                                    size={14}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.summaryMetaText}>
                                    {selectedLayoutData.cardsCount} карты
                                </Text>
                            </View>
                            <View style={styles.summaryMetaPill}>
                                <Ionicons
                                    name="sparkles-outline"
                                    size={14}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.summaryMetaText}>
                                    {selectedLayoutData.ritualLabel}
                                </Text>
                            </View>
                        </View>
                    ) : null}
                    <Text style={styles.summaryText}>
                        {selectedSourceData
                            ? `Колода: ${selectedSourceData.title}.`
                            : 'Выбери способ вытягивания карт.'}{' '}
                        {selectedLayout === 'daily'
                            ? 'Вопрос не нужен: ритуал будет работать как послание на день.'
                            : question.trim()
                              ? `Фокус вопроса: "${question.trim()}".`
                              : 'Можно идти дальше и без вопроса.'}
                    </Text>
                    {selectedEnergyCost !== null ? (
                        <View style={styles.summaryEnergyRow}>
                            <Ionicons
                                name="flash"
                                size={14}
                                color={COLORS.primary}
                            />
                            <Text style={styles.summaryEnergyText}>
                                Потребуется энергии: {selectedEnergyCost}
                            </Text>
                        </View>
                    ) : null}
                    {selectedEnergyCost !== null ? (
                        <View style={styles.summaryEnergyRow}>
                            <Ionicons
                                name="battery-half-outline"
                                size={14}
                                color={missingEnergy === 0 ? COLORS.primary : COLORS.accentGold}
                            />
                            <Text
                                style={[
                                    styles.summaryEnergyText,
                                    missingEnergy !== 0 && styles.summaryEnergyWarning,
                                ]}>
                                Баланс: {energyBalance ?? 0}
                                {missingEnergy !== 0
                                    ? ` · Нужно ещё ${missingEnergy}`
                                    : ' · Энергии достаточно'}
                            </Text>
                        </View>
                    ) : null}
                    {selectedLayoutData ? (
                        <Text style={styles.summaryLongText}>
                            {selectedLayoutData.fullDesc}
                        </Text>
                    ) : (
                        <Text style={styles.summaryLongText}>
                            Когда выберешь расклад, здесь появится собранная картина
                            ритуала.
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Нижний CTA: переход к следующему шагу после сборки ритуала. */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !isContinueEnabled && styles.continueButtonDisabled,
                        isContinueEnabled &&
                            !hasEnoughEnergy &&
                            styles.continueButtonWarning,
                    ]}
                    onPress={handleContinue}
                    disabled={!isContinueEnabled}
                    activeOpacity={0.85}>
                    <View>
                        <Text
                            style={[
                                styles.continueButtonTitle,
                                !isContinueEnabled &&
                                    styles.continueButtonTitleDisabled,
                            ]}>
                            {!hasEnoughEnergy
                                ? 'Пополнить энергию'
                                : selectedSource === 'physical'
                                  ? 'Перейти к выбору карт'
                                  : 'Открыть стол'}
                        </Text>
                        <Text
                            style={[
                                styles.continueButtonSubtitle,
                                !isContinueEnabled &&
                                    styles.continueButtonSubtitleDisabled,
                            ]}>
                            {isContinueEnabled
                                ? hasEnoughEnergy
                                  ? 'Ритуал собран. Можно начинать.'
                                  : `Не хватает ${missingEnergy ?? 0} энергии для старта`
                                : 'Выбери расклад и способ вытягивания'}
                        </Text>
                    </View>
                    <View style={styles.continueButtonRight}>
                        {isContinueEnabled && selectedEnergyCost !== null ? (
                            <View style={styles.energyPill}>
                                <Ionicons
                                    name="flash"
                                    size={14}
                                    color={COLORS.background}
                                />
                                <Text style={styles.energyPillText}>
                                    {selectedEnergyCost}
                                </Text>
                            </View>
                        ) : null}
                        <Ionicons
                            name="arrow-forward"
                            size={22}
                            color={
                                isContinueEnabled
                                    ? COLORS.background
                                    : COLORS.whiteMedium
                            }
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    // Базовый контейнер и фоновые декоративные формы.
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    ambientOrbOne: {
        position: 'absolute',
        top: -80,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(227, 179, 65, 0.08)',
    },
    ambientOrbTwo: {
        position: 'absolute',
        top: 180,
        left: -70,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(120, 208, 255, 0.06)',
    },

    // Верхняя навигация: back button + step-линейка.
    header: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.whiteLight,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    headerSteps: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 24,
    },
    stepPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.whiteLight,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    stepPillActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    stepIndex: {
        width: 20,
        height: 20,
        borderRadius: 10,
        textAlign: 'center',
        textAlignVertical: 'center',
        overflow: 'hidden',
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '800',
        backgroundColor: COLORS.background,
        marginRight: 6,
        lineHeight: 20,
    },
    stepIndexActive: {
        color: COLORS.background,
        backgroundColor: COLORS.primary,
    },
    stepLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
    },
    stepLabelActive: {
        color: COLORS.textMain,
    },
    stepDivider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.primaryBorder,
        marginHorizontal: 8,
    },

    // Hero-блок в верхней части экрана.
    heroCard: {
        backgroundColor: '#101725',
        borderRadius: 26,
        borderWidth: 0,
        borderColor: COLORS.primaryBorder,
        padding: 20,
        marginTop: 8,
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 10,
    },
    heroHalo: {
        position: 'absolute',
        top: -46,
        right: -18,
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: 'rgba(120, 208, 255, 0.12)',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    heroBadgeText: {
        color: COLORS.background,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 6,
    },
    heroGlyph: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(227, 179, 65, 0.2)',
    },
    heroTitle: {
        color: COLORS.textMain,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '700',
        marginBottom: 12,
        maxWidth: '88%',
    },
    heroSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 23,
        maxWidth: '92%',
    },
    heroBottomRow: {
        marginTop: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroStat: {
        minWidth: 54,
        alignItems: 'center',
    },
    heroStatValue: {
        color: COLORS.primary,
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 24,
    },
    heroStatLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    heroStatDivider: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 14,
    },
    heroStatWide: {
        flex: 1,
    },
    heroStatWideLabel: {
        color: COLORS.glowCyan,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroStatWideValue: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '700',
    },

    // Универсальные секции контента ниже hero.
    section: {
        marginBottom: 22,
    },
    sectionTitle: {
        color: COLORS.textMain,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
    },
    sectionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 14,
    },

    // Карточки выбора расклада.
    layoutCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    layoutCardActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    layoutAccentColumn: {
        alignItems: 'center',
        marginRight: 14,
    },
    layoutIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: COLORS.whiteLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    layoutIconActive: {
        backgroundColor: COLORS.primary,
    },
    layoutCardsMeta: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    layoutCardsMetaActive: {},
    layoutCardsMetaText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
    },
    layoutCardsMetaTextActive: {
        color: COLORS.primaryAccent,
    },
    layoutCostMeta: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    layoutCostMetaActive: {},
    layoutCostMetaText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    layoutCostMetaTextActive: {
        color: COLORS.primaryAccent,
    },
    layoutText: {
        flex: 1,
    },
    layoutMicroLabel: {
        color: COLORS.glowCyan,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 7,
    },
    layoutMicroLabelActive: {
        color: COLORS.primary,
    },
    layoutTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    layoutTitle: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        paddingRight: 8,
    },
    layoutTitleActive: {
        color: COLORS.primary,
    },
    layoutDesc: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6,
    },
    layoutDescActive: {
        color: COLORS.textMain,
    },
    layoutLongDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    layoutLongDescActive: {
        color: COLORS.textSecondary,
    },

    // Карточки выбора колоды.
    sourceList: {
        gap: 12,
    },
    sourceCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 16,
    },
    sourceCardActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    sourceTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    sourceIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.whiteLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceIconWrapActive: {
        backgroundColor: COLORS.primary,
    },
    sourceTitle: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginLeft: 10,
    },
    sourceTitleActive: {
        color: COLORS.primary,
    },
    sourceShortDesc: {
        color: COLORS.textMain,
        fontSize: 14,
        marginBottom: 6,
    },
    sourceShortDescActive: {
        color: COLORS.textMain,
    },
    sourceFullDesc: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 19,
    },
    sourceFullDescActive: {
        color: COLORS.textSecondary,
    },

    // Блок ввода вопроса пользователя.
    questionCard: {
        backgroundColor: COLORS.modalBackground,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 14,
    },
    questionInput: {
        minHeight: 200,
        color: COLORS.textMain,
        fontSize: 16,
        lineHeight: 24,
    },
    questionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    questionHint: {
        color: COLORS.textSecondary,
        fontSize: 12,
        flex: 1,
        marginRight: 12,
    },
    questionCount: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    // Summary-блок с итогом собранного ритуала.
    summaryCard: {
        backgroundColor: COLORS.whiteLight,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 18,
        marginBottom: 20,
    },
    summaryEyebrow: {
        color: COLORS.glowCyan,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        fontWeight: '700',
        marginBottom: 8,
    },
    summaryTitle: {
        color: COLORS.textMain,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    summaryMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    summaryMetaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    summaryMetaText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    summaryText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 10,
    },
    summaryEnergyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryEnergyText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 6,
    },
    summaryEnergyWarning: {
        color: COLORS.accentGold,
    },
    summaryLongText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },

    // Нижний action bar и основная кнопка перехода.
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryBorder,
        backgroundColor: COLORS.background,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    continueButtonDisabled: {
        backgroundColor: COLORS.whiteLight,
    },
    continueButtonWarning: {
        backgroundColor: COLORS.accentGold,
    },
    continueButtonRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    continueButtonTitle: {
        color: COLORS.background,
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    continueButtonTitleDisabled: {
        color: COLORS.whiteMedium,
    },
    continueButtonSubtitle: {
        color: 'rgba(10, 14, 20, 0.72)',
        fontSize: 13,
    },
    continueButtonSubtitleDisabled: {
        color: COLORS.textSecondary,
    },
    energyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 14, 20, 0.16)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 10,
    },
    energyPillText: {
        color: COLORS.background,
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 4,
    },
})
