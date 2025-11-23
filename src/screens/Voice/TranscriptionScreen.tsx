import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform, PermissionsAndroid, Image } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent, SpeechEndEvent } from '@react-native-voice/voice';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';

interface Message {
    id: string;
    text: string;
    timestamp: number;
}

export const TranscriptionScreen: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [partialText, setPartialText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setIsTranscribing } = useApp();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);

    const isListeningRef = useRef(isListening);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        console.log('TranscriptionScreen: MOUNTING - Setting isTranscribing to TRUE');
        setIsTranscribing(true);
        setupVoice();
        checkPermissionsAndStart();

        return () => {
            console.log('TranscriptionScreen: UNMOUNTING - Setting isTranscribing to FALSE');
            Voice.destroy().then(Voice.removeAllListeners);
            setIsTranscribing(false);
        };
    }, []);

    const setupVoice = async () => {
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechEnd = onSpeechEnd;
    };

    const startRecognizing = async () => {
        try {
            isListeningRef.current = true;
            await Voice.start('es-ES');
            setError(null);
            setIsListening(true);
        } catch (e) {
            console.error(e);
            setError('Error al iniciar voz');
        }
    };

    const stopRecognizing = async () => {
        try {
            isListeningRef.current = false;
            await Voice.stop();
            setIsListening(false);
        } catch (e) {
            console.error(e);
        }
    };

    const checkPermissionsAndStart = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Permiso de Micrófono',
                        message: 'GafasIOT necesita acceso al micrófono para la transcripción.',
                        buttonNeutral: 'Preguntar luego',
                        buttonNegative: 'Cancelar',
                        buttonPositive: 'OK',
                    },
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    startRecognizing();
                } else {
                    setError('Permiso denegado');
                }
            } catch (err) {
                console.warn(err);
            }
        } else {
            startRecognizing();
        }
    };

    const onSpeechError = (e: SpeechErrorEvent) => {
        const errorCode = e.error?.code;
        // 7 = No match, 6 = No speech input. Treat as silence.
        if (errorCode === '7' || errorCode === '6') {
            setIsListening(false);
            isListeningRef.current = false;
            return;
        }

        console.error('Speech error:', e);
        setError(e.error?.message || 'Error desconocido');
        setIsListening(false);
        isListeningRef.current = false;
    };

    const onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
            setPartialText(e.value[0]);
            setError(null);
        }
    };

    const onSpeechEnd = (e: SpeechEndEvent) => {
        console.log('Speech ended');
        commitText();
        setIsListening(false);
        isListeningRef.current = false;
    };


    const toggleListening = () => {
        if (isListening) {
            commitText();
            stopRecognizing();
        } else {
            startRecognizing();
        }
    };

    const commitText = () => {
        if (partialText.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: partialText,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, newMessage]);
            setPartialText('');
            // Scroll to bottom
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Conversación</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                ListFooterComponent={
                    partialText ? (
                        <View style={[styles.messageBubble, styles.partialBubble]}>
                            <Text style={styles.partialText}>{partialText}...</Text>
                        </View>
                    ) : null
                }
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.micButton, isListening ? styles.micActive : styles.micInactive]}
                    onPress={toggleListening}
                >
                    <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎙️'}</Text>
                </TouchableOpacity>
                <Text style={styles.statusText}>
                    {isListening ? 'Escuchando...' : 'Toca para hablar'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure Black
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#00FF9D', // Neon Green
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    list: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messageBubble: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        marginBottom: 12,
        alignSelf: 'flex-start',
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: '#222',
    },
    partialBubble: {
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#00FF9D',
        opacity: 0.8,
    },
    messageText: {
        color: 'white',
        fontSize: 24,
        lineHeight: 32,
    },
    partialText: {
        color: '#00FF9D',
        fontSize: 24,
        fontStyle: 'italic',
    },
    timestamp: {
        color: '#666',
        fontSize: 12,
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    errorText: {
        color: '#FF0055', // Neon Red
        textAlign: 'center',
        marginBottom: 10,
    },
    controls: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#111',
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    micActive: {
        backgroundColor: '#FF0055', // Neon Red
        shadowColor: '#FF0055',
    },
    micInactive: {
        backgroundColor: '#00FF9D', // Neon Green
        shadowColor: '#00FF9D',
    },
    micIcon: {
        fontSize: 40,
    },
    statusText: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '500',
    },
});
