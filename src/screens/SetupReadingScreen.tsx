import React, { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { LayoutType, DrawSource } from '../types/dto'

type SetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetupReading'>

const LAYOUT_OPTIONS: { id: LayoutType; title: string; desc: string; icon: any }[] = [
    {
        id: 'daily',
        title: 'Карта Дня',
        desc: 'На сегодня',
        icon: 'sunny-outline',
    },
    {
        id: 'chronological',
        title: 'Прошлое, Настоящее, Будущее',
        desc: 'На ситуацию',
        icon: 'hourglass-outline',
    },
    {
        id: 'partner',
        title: 'Отношения',
        desc: 'Ты и партнер',
        icon: 'heart-half-outline',
    },
    {
        id: 'reflective',
        title: 'Конфликт',
        desc: 'Анализ',
        icon: 'eye-outline',
    },
]

export const SetupReadingScreen = () => {
    const navigation = useNavigation<SetupScreenNavigationProp>()

    const [selectedLayout, setSelectedLayout] = useState<LayoutType>('daily')
    const [selectedSource, setSelectedSource] = useState<DrawSource>('app')
    const [question, setQuestion] = useState('')

    const handleContinue = () => {
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

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#D4AF37" />
                        <Text style={styles.backText}>Назад</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Выбери Расклад</Text>
                    <View style={styles.optionsGrid}>
                        {LAYOUT_OPTIONS.map(option => {
                            const isSelected = selectedLayout === option.id
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => setSelectedLayout(option.id)}
                                    activeOpacity={0.7}>
                                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                        <Ionicons
                                            name={option.icon}
                                            size={28}
                                            color={isSelected ? '#0A0A1A' : '#D4AF37'}
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
                                        numberOfLines={1}>
                                        {option.desc}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {selectedLayout !== 'daily' && (
                        <View style={styles.questionSection}>
                            <Text style={styles.sectionTitle}>Твой Вопрос</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Например: Как пройдет встреча завтра?"
                                placeholderTextColor="#8A8A9E"
                                value={question}
                                onChangeText={setQuestion}
                                multiline
                                maxLength={150}
                                textAlignVertical="top"
                            />
                        </View>
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: selectedLayout !== 'daily' ? 16 : 24 }]}>
                        Колода
                    </Text>
                    <View style={styles.sourceGrid}>
                        <TouchableOpacity
                            style={[
                                styles.sourceCard,
                                selectedSource === 'app' && styles.optionCardSelected,
                            ]}
                            onPress={() => setSelectedSource('app')}
                            activeOpacity={0.7}>
                            <Ionicons
                                name="phone-portrait-outline"
                                size={24}
                                color={selectedSource === 'app' ? '#0A0A1A' : '#D4AF37'}
                                style={styles.sourceIcon}
                            />
                            <Text
                                style={[
                                    styles.sourceTitle,
                                    selectedSource === 'app' && styles.textSelected,
                                ]}>
                                Виртуальная
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sourceCard,
                                selectedSource === 'physical' && styles.optionCardSelected,
                            ]}
                            onPress={() => setSelectedSource('physical')}
                            activeOpacity={0.7}>
                            <Ionicons
                                name="hand-right-outline"
                                size={24}
                                color={selectedSource === 'physical' ? '#0A0A1A' : '#D4AF37'}
                                style={styles.sourceIcon}
                            />
                            <Text
                                style={[
                                    styles.sourceTitle,
                                    selectedSource === 'physical' && styles.textSelected,
                                ]}>
                                Физическая
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Продолжить</Text>
                        <Ionicons name="arrow-forward" size={20} color="#0A0A1A" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#D4AF37', fontSize: 16, marginLeft: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    
    // Сетка для раскладов
    optionsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        gap: 12 
    },
    optionCard: {
        width: '48%', // Половина ширины минус отступ
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        padding: 16,
    },
    optionCardSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainerSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    optionTitle: { color: '#D4AF37', fontSize: 15, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    optionDesc: { color: '#8A8A9E', fontSize: 12, textAlign: 'center' },
    textSelected: { color: '#0A0A1A' },

    // Поле ввода вопроса
    questionSection: { marginTop: 12 },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        height: 80, // Сделано поменьше по высоте
    },

    // Сетка для выбора колоды
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        padding: 14,
    },
    sourceIcon: { marginRight: 8 },
    sourceTitle: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },

    footer: {
        padding: 16,
        backgroundColor: '#0A0A1A',
        borderTopWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    continueButton: {
        backgroundColor: '#D4AF37',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 30,
    },
    continueButtonText: {
        color: '#0A0A1A',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 8,
    },
})
