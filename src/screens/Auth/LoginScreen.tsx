import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { authService } from '../../services/authService';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        try {
            if (isRegistering) {
                await authService.signUpWithEmail(email, password);
                Alert.alert(
                    '¡Registro exitoso! 📧',
                    'Hemos enviado un enlace de confirmación a tu correo. Por favor, verifícalo para iniciar sesión.',
                    [{ text: 'OK', onPress: () => setIsRegistering(false) }]
                );
            } else {
                await authService.signInWithPassword(email, password);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleResendEmail() {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu email primero');
            return;
        }
        setLoading(true);
        try {
            await authService.resendConfirmationEmail(email);
            Alert.alert('Enviado', 'Se ha reenviado el correo de confirmación.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GafasIOT</Text>
            <Text style={styles.subtitle}>
                {isRegistering ? 'Crea una cuenta nueva' : 'Inicia sesión para continuar'}
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00FF9D" />
            ) : (
                <>
                    <Button
                        title={isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
                        onPress={handleAuth}
                        color="#00FF9D"
                    />

                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleButton}>
                        <Text style={styles.toggleText}>
                            {isRegistering
                                ? "¿Ya tienes cuenta? Inicia Sesión"
                                : "¿No tienes cuenta? Regístrate aquí"}
                        </Text>
                    </TouchableOpacity>

                    {!isRegistering && (
                        <TouchableOpacity onPress={handleResendEmail} style={styles.resendButton}>
                            <Text style={styles.resendText}>¿No recibiste el correo? Reenviar</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure Black
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: '#00FF9D',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#ccc',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#00FF9D', // Neon Green
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#111',
        color: 'white',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    toggleButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: '#00FF9D',
        fontSize: 16,
        fontWeight: '500',
    },
    resendButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    resendText: {
        color: '#FFD60A', // Neon Yellow
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
