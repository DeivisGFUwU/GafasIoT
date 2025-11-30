import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Detection } from '../types';

// Simple icon mapping (using text/emoji for now to avoid extra deps, 
// but designed to be easily swapped for Lucide/Ionicons)
const ICONS: Record<string, string> = {
    // Red / Danger
    sirena: '🚨',
    claxon: '🚗', // Or 📢
    alarma: '🔔',
    grito: '😱',

    // Yellow / Warning
    voz: '🗣️',
    bebe: '👶',

    // Green / Info
    timbre: '🚪',
    perro: '🐕',
    ruido: '🔊',

    default: '🔔',
};

const ARROWS: Record<string, string> = {
    izquierda: '⬅️',
    derecha: '➡️',
    frente: '⬆️',
    atrás: '⬇️',
    arriba: '↗️',
};

interface LiveAlertProps {
    detection: Detection;
    onPress?: () => void;
}

export const LiveAlert: React.FC<LiveAlertProps> = ({ detection, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, [detection]);

    const color = getPriorityColor(detection.prioridad);
    const icon = ICONS[detection.tipo.toLowerCase()] || ICONS.default;
    const arrow = ARROWS[detection.direccion.toLowerCase()] || '';

    const shouldBeClickable = (detection.prioridad === 'amarillo') && onPress;

    const content = (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: color, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.type}>{detection.tipo.toUpperCase()}</Text>

                <View style={styles.directionContainer}>
                    {arrow ? <Text style={styles.arrow}>{arrow}</Text> : null}
                    <Text style={styles.direction}>{detection.direccion.toUpperCase()}</Text>
                </View>

                {shouldBeClickable && (
                    <Text style={styles.tapHint}>Toca para transcribir</Text>
                )}
            </View>
        </Animated.View>
    );

    if (shouldBeClickable) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'rojo': return '#FF0055'; // Neon Red
        case 'amarillo': return '#FFD60A'; // Neon Yellow
        case 'verde': return '#00FF9D'; // Neon Green
        default: return '#33b5e5';
    }
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        width: width * 0.9,
        height: width * 0.9, // Square aspect ratio
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        marginBottom: 20,
    },
    content: {
        alignItems: 'center',
    },
    icon: {
        fontSize: 80,
        marginBottom: 10,
    },
    type: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        marginBottom: 20,
    },
    directionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
    },
    arrow: {
        fontSize: 40,
        marginRight: 10,
        color: 'white',
    },
    direction: {
        fontSize: 24,
        fontWeight: '600',
        color: 'white',
    },
    tapHint: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 15,
        fontSize: 14,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
});
