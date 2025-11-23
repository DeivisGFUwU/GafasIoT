import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';

type DetectionDetailRouteProp = RouteProp<RootStackParamList, 'DetectionDetail'>;

export const DetectionDetailScreen: React.FC = () => {
    const route = useRoute<DetectionDetailRouteProp>();
    const { detection } = route.params;

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.header, { borderColor: getPriorityColor(detection.prioridad) }]}>
                <Text style={styles.type}>{detection.tipo.toUpperCase()}</Text>
                <Text style={[styles.priority, { color: getPriorityColor(detection.prioridad) }]}>
                    {detection.prioridad.toUpperCase()}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Dirección</Text>
                <Text style={styles.value}>{detection.direccion}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Intensidad</Text>
                <Text style={styles.value}>{detection.intensidad.toFixed(2)}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Hora</Text>
                <Text style={styles.value}>{new Date(detection.timestamp!).toLocaleString()}</Text>
            </View>

            {detection.extra && (
                <View style={styles.section}>
                    <Text style={styles.label}>Datos Extra</Text>
                    <Text style={styles.json}>{JSON.stringify(detection.extra, null, 2)}</Text>
                </View>
            )}
        </ScrollView>
    );
};

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'rojo': return '#ff4444';
        case 'amarillo': return '#ffbb33';
        case 'verde': return '#00C851';
        default: return '#fff';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050816',
        padding: 20,
    },
    header: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        backgroundColor: '#101528',
    },
    type: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    priority: {
        fontSize: 20,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#101528',
        padding: 16,
        borderRadius: 8,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        color: 'white',
        fontSize: 18,
    },
    json: {
        color: '#00e676',
        fontFamily: 'monospace',
        fontSize: 14,
    },
});
