import React, { useState, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    LayoutAnimation,
    Platform,
    UIManager,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { TarotApi } from '../api/tarot.api'
import { TAROT_IMAGES } from '../constants/tarotImages'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
}

const LIMIT = 10 // Количество записей на одну страницу

export const HistoryScreen = () => {
    const navigation = useNavigation()

    // Стейты для данных и пагинации
    const [history, setHistory] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Стейты для загрузки
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Загрузка первой страницы (срабатывает при входе на экран)
    useFocusEffect(
        useCallback(() => {
            let isMounted = true
            const fetchInitial = async () => {
                setIsInitialLoading(true)
                try {
                    const response = await TarotApi.getHistory(1, LIMIT)
                    if (isMounted) {
                        const items = response.data || []
                        setHistory(items)
                        setPage(1)
                        setHasMore(items.length < response.total)
                    }
                } catch (e) {
                    console.error('Ошибка загрузки истории:', e)
                } finally {
                    if (isMounted) setIsInitialLoading(false)
                }
            }
            fetchInitial()
            return () => {
                isMounted = false
            }
        }, []),
    )

    // Ленивая подгрузка следующих страниц
    const loadMore = async () => {
        if (isLoadingMore || !hasMore || isInitialLoading) return

        setIsLoadingMore(true)
        try {
            const nextPage = page + 1
            const response = await TarotApi.getHistory(nextPage, LIMIT)
            const newItems = response.data || []

            setHistory(prev => [...prev, ...newItems])
            setPage(nextPage)
            setHasMore(history.length + newItems.length < response.total)
        } catch (e) {
            console.error('Ошибка подгрузки:', e)
        } finally {
            setIsLoadingMore(false)
        }
    }

    // Удаление записи
    const handleDelete = (id: string) => {
        Alert.alert(
            'Удаление',
            'Вы уверены, что хотите удалить этот расклад? Это действие нельзя отменить.',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await TarotApi.deleteHistoryItem(id)
                            // Обновляем список локально, чтобы не делать лишний запрос к БД
                            setHistory(prev => prev.filter(item => item.id !== id))
                        } catch (e) {
                            Alert.alert('Ошибка', 'Не удалось удалить запись.')
                        }
                    },
                },
            ],
        )
    }

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setExpandedId(expandedId === id ? null : id)
    }

    const renderItem = ({ item }: { item: any }) => {
        const isExpanded = expandedId === item.id

        // Делаем дату красивой и читаемой, она теперь главный заголовок
        const dateObj = new Date(item.createdAt)
        const formattedDate = dateObj.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        const formattedTime = dateObj.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        })

        return (
            <TouchableOpacity
                style={[styles.card, isExpanded && styles.cardActive]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dateTitle}>
                            {formattedDate} в {formattedTime}
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        {isExpanded && (
                            <TouchableOpacity
                                onPress={() => handleDelete(item.id)}
                                style={styles.deleteButton}>
                                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        )}
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color="#D4AF37"
                        />
                    </View>
                </View>

                {/* УВЕЛИЧЕННЫЕ МИНИ-КАРТЫ */}
                <View style={styles.miniCardsRow}>
                    {item.cards?.map((card: any, idx: number) => (
                        <View key={idx} style={styles.historyMiniCard}>
                            {TAROT_IMAGES[card.id] ? (
                                <Image
                                    source={TAROT_IMAGES[card.id]}
                                    style={[
                                        styles.miniCardImg,
                                        card.isReversed && { transform: [{ rotate: '180deg' }] },
                                    ]}
                                />
                            ) : (
                                <View style={styles.cardFallback} />
                            )}
                        </View>
                    ))}
                </View>

                {item.question && (
                    <Text style={styles.questionPreview} numberOfLines={isExpanded ? 0 : 1}>
                        «{item.question}»
                    </Text>
                )}

                {isExpanded && (
                    <View style={styles.expandedBox}>
                        <View style={styles.divider} />
                        <Text style={styles.aiText}>{item.aiResponse}</Text>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#D4AF37" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Дневник Раскладов</Text>
                <View style={{ width: 28 }} />
            </View>

            {isInitialLoading ? (
                <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5} // Начинает подгружать, когда осталось пол-экрана до конца списка
                    ListFooterComponent={
                        isLoadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color="#D4AF37"
                                style={{ marginVertical: 20 }}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="journal-outline" size={64} color="#333" />
                            <Text style={styles.emptyText}>Ваш дневник пока пуст</Text>
                            <Text style={styles.emptySubtext}>
                                Сделайте свой первый расклад, и он сохранится здесь.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A2A',
    },
    screenTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#111122',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardActive: { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.05)' },

    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    deleteButton: { paddingHorizontal: 12, paddingVertical: 4 },

    // КАРТЫ УВЕЛИЧЕНЫ: были 32x50, стали 48x75
    miniCardsRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
    historyMiniCard: {
        width: 48,
        height: 75,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#444',
    },
    miniCardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    cardFallback: { flex: 1, backgroundColor: '#1A1A2A' },

    questionPreview: { color: '#E0E0E0', fontSize: 15, fontStyle: 'italic', marginBottom: 4 },

    expandedBox: { marginTop: 12 },
    divider: { height: 1, backgroundColor: 'rgba(212, 175, 55, 0.2)', marginBottom: 12 },
    aiText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24, textAlign: 'justify' },

    empty: { flex: 1, alignItems: 'center', marginTop: 80 },
    emptyText: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: { color: '#8A8A9E', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
})
