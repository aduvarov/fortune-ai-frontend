import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getOrCreateDeviceId } from '../utils/device';
import { RootStackParamList } from '../types/navigation';
import { COLORS } from '../constants/theme';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth.api';
import {
    createMockToken,
    createMockUser,
    isMockAuthEnabled,
} from '../utils/dev';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
    const navigation = useNavigation<AuthScreenNavigationProp>();
    const { setAuth } = useAuthStore();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = async (anonymousToken: string) => {
        if (anonymousToken) {
            try {
                await authApi.syncAccounts(anonymousToken);
                console.log('History synced successfully');
            } catch (err) {
                console.error('Failed to sync history:', err);
                Alert.alert(
                    'Внимание',
                    'Ваша история анонимных гаданий не была перенесена. Вы можете продолжить, но старые записи могут быть недоступны.'
                );
            }
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Ошибка', 'Заполните все поля');
            return;
        }

        // Захватываем анонимный токен ПЕРЕД входом
        const anonymousToken = useAuthStore.getState().token;

        setIsLoading(true);
        try {
            if (isMockAuthEnabled) {
                const deviceId = await getOrCreateDeviceId();
                setAuth(
                    createMockToken('email'),
                    createMockUser('email', deviceId, email),
                );
                navigation.replace('Home');
                return;
            }

            const { data, error } = isLogin
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({ email, password });

            if (error) throw error;

            if (data.session && data.user) {
                const deviceId = await getOrCreateDeviceId();
                setAuth(data.session.access_token, {
                    id: data.user.id,
                    deviceId,
                    role: 'user',
                    email: data.user.email,
                    authProvider: 'email',
                });

                // Синхронизируем ЯВНО передавая новый токен
                if (anonymousToken) {
                    await handleSync(anonymousToken);
                }

                navigation.replace('Home');
            } else if (!isLogin) {
                Alert.alert('Успех', 'Пожалуйста, проверьте свою почту для подтверждения (если требуется).');
            }
        } catch (error: any) {
            Alert.alert('Ошибка Auth', error.message || 'Что-то пошло не так');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        // Захватываем анонимный токен ПЕРЕД входом
        const anonymousToken = useAuthStore.getState().token;

        setIsLoading(true);
        try {
            if (isMockAuthEnabled) {
                const deviceId = await getOrCreateDeviceId();
                setAuth(
                    createMockToken('google'),
                    createMockUser('google', deviceId, 'design@google.dev'),
                );
                navigation.replace('Home');
                return;
            }

            const { GoogleSignin } = require('@react-native-google-signin/google-signin');
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            });

            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                if (data.session && data.user) {
                    const deviceId = await getOrCreateDeviceId();
                    setAuth(data.session.access_token, {
                        id: data.user.id,
                        deviceId,
                        role: 'user',
                        email: data.user.email,
                        authProvider: 'google',
                    });

                    // Синхронизируем ЯВНО передавая новый токен
                    if (anonymousToken) {
                        await handleSync(anonymousToken);
                    }

                    navigation.replace('Home');
                }
            }
        } catch (error: any) {
            Alert.alert('Ошибка Google Auth', error.message || 'Ошибка входа через Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    {isMockAuthEnabled && (
                        <View style={styles.devBanner}>
                            <Ionicons name="flask-outline" size={18} color={COLORS.background} />
                            <Text style={styles.devBannerText}>
                                Mock auth mode: Google и email логин эмулируются без native SDK
                            </Text>
                        </View>
                    )}

                    <Text style={styles.title}>{isLogin ? 'С возвращением' : 'Присоединяйтесь'}</Text>
                    <Text style={styles.subtitle}>
                        {isLogin
                            ? 'Войдите, чтобы сохранить историю своих гаданий'
                            : 'Создайте аккаунт, чтобы ваши расклады были всегда под рукой'}
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Пароль"
                                placeholderTextColor={COLORS.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={handleEmailAuth}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.background} />
                            ) : (
                                <Text style={styles.mainButtonText}>{isLogin ? 'Войти' : 'Зарегистрироваться'}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>или</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleAuth}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-google" size={20} color={COLORS.textMain} style={styles.btnIcon} />
                            <Text style={styles.googleButtonText}>Войти через Google</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.footerLink}>
                                {isLogin ? ' Зарегистрироваться' : ' Войти'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AuthScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    devBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 18,
    },
    devBannerText: {
        flex: 1,
        color: COLORS.background,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 16,
    },
    backButton: {
        marginTop: 10,
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textMain,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 30,
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: COLORS.textMain,
        fontSize: 16,
    },
    mainButton: {
        backgroundColor: COLORS.primary,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    mainButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.cardBorder,
    },
    dividerText: {
        color: COLORS.textSecondary,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleButtonText: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: '600',
    },
    btnIcon: {
        marginRight: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    footerLink: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
