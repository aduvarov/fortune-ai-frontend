import React, { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { COLORS } from '../constants/theme'
import { RootStackParamList } from '../types/navigation'
import { EnergyApi } from '../api/energy.api'
import { EnergyPackage, PurchaseEnergyDto } from '../types/energy'
import { useAuthStore } from '../store/useAuthStore'
import { isMockAuthEnabled } from '../utils/dev'

type EnergyNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Energy'>

export const EnergyScreen = () => {
    const navigation = useNavigation<EnergyNavigationProp>()
    const energyBalance = useAuthStore(state => state.energyBalance)
    const setEnergyBalance = useAuthStore(state => state.setEnergyBalance)

    const [packages, setPackages] = useState<EnergyPackage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRewarding, setIsRewarding] = useState(false)
    const [activePackageId, setActivePackageId] = useState<string | null>(null)

    const applyLocalEnergyDelta = (delta: number) => {
        setEnergyBalance((energyBalance ?? 0) + delta)
    }

    const loadEnergy = useCallback(async () => {
        try {
            if (isMockAuthEnabled) {
                setPackages([
                    { id: 'energy_100', energyAmount: 100, title: 'Пакет 100 энергии' },
                    { id: 'energy_250', energyAmount: 250, title: 'Пакет 250 энергии' },
                    { id: 'energy_700', energyAmount: 700, title: 'Пакет 700 энергии' },
                ])
                return
            }

            const [balanceResponse, packagesResponse] = await Promise.all([
                EnergyApi.getBalance(),
                EnergyApi.getPackages(),
            ])

            setEnergyBalance(balanceResponse.balance)
            setPackages(packagesResponse.packages)
        } catch (error) {
            console.error('Не удалось загрузить экран энергии', error)
            Alert.alert('Ошибка', 'Не удалось загрузить баланс энергии.')
        } finally {
            setIsLoading(false)
        }
    }, [setEnergyBalance])

    useEffect(() => {
        void loadEnergy()
    }, [loadEnergy])

    const handleRewardAd = async () => {
        try {
            setIsRewarding(true)

            if (isMockAuthEnabled) {
                applyLocalEnergyDelta(10)
                return
            }

            const response = await EnergyApi.rewardAd()
            setEnergyBalance(response.balance)
        } catch (error) {
            console.error('Не удалось начислить энергию за рекламу', error)
            Alert.alert('Ошибка', 'Не удалось начислить энергию. Попробуйте ещё раз.')
        } finally {
            setIsRewarding(false)
        }
    }

    const handlePurchase = async (pkg: EnergyPackage) => {
        try {
            setActivePackageId(pkg.id)

            if (isMockAuthEnabled) {
                applyLocalEnergyDelta(pkg.energyAmount)
                Alert.alert('Mock purchase', `Начислено ${pkg.energyAmount} энергии.`)
                return
            }

            const response = await EnergyApi.purchasePackage({
                packageId: pkg.id as PurchaseEnergyDto['packageId'],
            })
            setEnergyBalance(response.balance)
            Alert.alert('Энергия начислена', `Пакет "${pkg.title}" успешно зачислен.`)
        } catch (error) {
            console.error('Не удалось зачислить пакет энергии', error)
            Alert.alert('Ошибка', 'Не удалось зачислить пакет энергии.')
        } finally {
            setActivePackageId(null)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Энергия</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Текущий баланс</Text>
                    <View style={styles.heroBalanceRow}>
                        <Ionicons name="flash" size={28} color={COLORS.primary} />
                        <Text style={styles.heroBalanceValue}>{energyBalance ?? 0}</Text>
                    </View>
                    <Text style={styles.heroHint}>
                        Энергия тратится на расклады и пополняется рекламой, бонусами и пакетами.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Быстрое пополнение</Text>
                    <TouchableOpacity
                        style={styles.rewardCard}
                        onPress={handleRewardAd}
                        disabled={isRewarding}
                        activeOpacity={0.8}>
                        <View style={styles.rewardCardLeft}>
                            <View style={styles.rewardIconWrap}>
                                {isRewarding ? (
                                    <ActivityIndicator size="small" color={COLORS.background} />
                                ) : (
                                    <Ionicons name="play-circle" size={22} color={COLORS.background} />
                                )}
                            </View>
                            <View>
                                <Text style={styles.rewardTitle}>Смотреть рекламу</Text>
                                <Text style={styles.rewardSubtitle}>Получить +10 энергии</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Пакеты энергии</Text>
                    <Text style={styles.sectionHint}>
                        Пока это dev-flow без store receipts, но API и баланс уже работают.
                    </Text>

                    {isLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
                    ) : (
                        packages.map(pkg => (
                            <TouchableOpacity
                                key={pkg.id}
                                style={styles.packageCard}
                                onPress={() => handlePurchase(pkg)}
                                disabled={activePackageId === pkg.id}
                                activeOpacity={0.8}>
                                <View>
                                    <Text style={styles.packageTitle}>{pkg.title}</Text>
                                    <Text style={styles.packageEnergy}>+{pkg.energyAmount} энергии</Text>
                                </View>

                                {activePackageId === pkg.id ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <View style={styles.packageAction}>
                                        <Ionicons name="flash" size={14} color={COLORS.primary} />
                                        <Text style={styles.packageActionText}>Зачислить</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>
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
        width: 36,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 20,
    },
    heroCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 22,
    },
    heroEyebrow: {
        color: COLORS.textSecondary,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    heroBalanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    heroBalanceValue: {
        color: COLORS.primary,
        fontSize: 36,
        fontWeight: '700',
    },
    heroHint: {
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    section: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        padding: 18,
    },
    sectionTitle: {
        color: COLORS.textMain,
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionHint: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 14,
    },
    loader: {
        marginTop: 12,
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        backgroundColor: COLORS.primaryLight,
        padding: 16,
    },
    rewardCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rewardIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
    },
    rewardTitle: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '600',
    },
    rewardSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.whiteLight,
        padding: 16,
        marginTop: 12,
    },
    packageTitle: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '600',
    },
    packageEnergy: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 4,
    },
    packageAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        backgroundColor: COLORS.primaryLight,
    },
    packageActionText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
    },
})
