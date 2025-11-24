import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { bleService, BLEService } from '../../services/bleService';
import { detectionService } from '../../services/DetectionService';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useAlert } from '../../context/AlertContext';

export const ScanScreen: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [bleEnabled, setBleEnabled] = useState<boolean | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const navigation = useNavigation<any>();
    const { setIsBleConnected } = useApp();
    const { triggerAlert } = useAlert();

    useEffect(() => {
        checkBleAndStart();
        return () => {
            bleService.stopScan();
        };
    }, []);

    const checkBleAndStart = async () => {
        setStatusMessage('Verificando Bluetooth...');
        const isEnabled = await bleService.checkBluetoothState();
        setBleEnabled(isEnabled);

        if (isEnabled) {
            startScan();
        } else {
            setStatusMessage('Bluetooth desactivado');
        }
    };

    const startScan = async () => {
        // Check BLE state first
        const isEnabled = await bleService.checkBluetoothState();
        setBleEnabled(isEnabled);

        if (!isEnabled) {
            Alert.alert(
                'Bluetooth Desactivado',
                'Por favor, activa el Bluetooth en tu dispositivo para buscar las gafas.',
                [
                    { text: 'Reintentar', onPress: () => checkBleAndStart() },
                    { text: 'Cancelar', style: 'cancel' }
                ]
            );
            return;
        }

        const hasPermissions = await bleService.requestPermissions();
        if (!hasPermissions) {
            Alert.alert('Permiso denegado', 'Se requiere permiso de Bluetooth y Ubicación para escanear.');
            return;
        }

        setIsScanning(true);
        setDevices([]);
        setStatusMessage('Escaneando dispositivos BLE...');

        bleService.startScan(
            (device) => {
                // Broad scan filter: Check name OR Service UUIDs
                const name = device.name || device.localName || '';
                const isTarget = name.toLowerCase().includes('esp32') ||
                    name.toLowerCase().includes('gafas') ||
                    name.toLowerCase().includes('lentessordos') ||
                    (device.serviceUUIDs && device.serviceUUIDs.includes(BLEService.SERVICE_UUID));

                if (isTarget) {
                    // Auto-connect logic:
                    console.log('Target Device found:', name, device.id);
                    setStatusMessage(`Encontrado: ${name || 'Dispositivo'}. Conectando...`);
                    bleService.stopScan();
                    setIsScanning(false);
                    connect(device);
                }
            },
            (error) => {
                console.error(error);
                setIsScanning(false);
                setStatusMessage(`Error de escaneo: ${error.message}`);
                Alert.alert('Error de escaneo', error.message);
            }
        );
    };

    const connect = async (device: Device) => {
        bleService.stopScan();
        setIsScanning(false);
        try {
            setStatusMessage('Conectando y descubriendo servicios...');
            await bleService.connectToDevice(device.id);

            setStatusMessage('Conectado. Activando notificaciones...');
            setIsBleConnected(true);

            // Start listening for notifications
            await bleService.monitorDevice(
                device.id,
                async (data) => {
                    console.log('🔔 [ScanScreen] BLE Data received:', data);
                    try {
                        const payload = detectionService.adaptFirmwarePayload(data);
                        console.log('📦 [ScanScreen] Detection payload:', payload);

                        // Use AlertContext to trigger alert (handles DB insert + notification)
                        await triggerAlert(payload);

                        console.log('✅ [ScanScreen] Alert triggered successfully');
                    } catch (err) {
                        console.error('❌ [ScanScreen] Error processing BLE data:', err);
                    }
                },
                () => {
                    console.log('Device disconnected callback triggered');
                    setIsBleConnected(false);
                    setStatusMessage('Dispositivo desconectado');
                    Alert.alert('Desconectado', 'El dispositivo se ha desconectado.');
                    // Optionally navigate back to ScanScreen if we are not there, 
                    // but since we passed the callback here, we might need a global handler.
                    // For now, updating the context state is the critical part.
                }
            );

            // Navigate to Home to see alerts
            navigation.navigate('Home');

        } catch (e: any) {
            setStatusMessage(`Error de conexión: ${e.message}`);
            Alert.alert('Error de conexión', e.message);
        }
    };

    const renderItem = ({ item }: { item: Device }) => {
        const isTarget = item.name?.toLowerCase().includes('esp32') || item.name?.toLowerCase().includes('gafas');

        return (
            <TouchableOpacity
                style={[styles.deviceItem, isTarget && styles.targetDevice]}
                onPress={() => connect(item)}
            >
                <View>
                    <Text style={[styles.deviceName, isTarget && styles.targetText]}>
                        {item.name || 'Dispositivo Desconocido'}
                    </Text>
                    <Text style={styles.deviceId}>{item.id}</Text>
                    <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
                </View>
                {isTarget && <View style={styles.badge}><Text style={styles.badgeText}>RECOMENDADO</Text></View>}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Escáner Bluetooth</Text>
                <View style={styles.headerRight}>
                    {bleEnabled === false && (
                        <View style={styles.bleWarning}>
                            <Text style={styles.bleWarningText}>⚠️ BLE Apagado</Text>
                        </View>
                    )}
                    {isScanning && <ActivityIndicator color="#33b5e5" />}
                </View>
            </View>

            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    bleEnabled === false ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📡</Text>
                            <Text style={styles.emptyTitle}>Bluetooth Desactivado</Text>
                            <Text style={styles.emptyText}>
                                Activa el Bluetooth en tu dispositivo para buscar las gafas IoT.
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={checkBleAndStart}
                            >
                                <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color="#33b5e5" style={{ marginBottom: 20 }} />
                            <Text style={styles.emptyTitle}>Buscando Gafas...</Text>
                            <Text style={styles.emptyText}>{statusMessage || 'Acerca el dispositivo para conectar automáticamente.'}</Text>
                        </View>
                    )
                }
            />

            <TouchableOpacity style={styles.scanButton} onPress={startScan}>
                <Text style={styles.scanButtonText}>{isScanning ? 'Escaneando...' : 'Reiniciar Escaneo'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050816',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    bleWarning: {
        backgroundColor: '#FFD60A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 10,
    },
    bleWarningText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 80,
    },
    deviceItem: {
        backgroundColor: '#101528',
        padding: 16,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    targetDevice: {
        borderColor: '#33b5e5',
        borderWidth: 1,
        backgroundColor: 'rgba(51, 181, 229, 0.1)',
    },
    deviceName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    targetText: {
        color: '#33b5e5',
    },
    deviceId: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 4,
    },
    rssi: {
        color: '#4b5563',
        fontSize: 12,
    },
    badge: {
        backgroundColor: '#33b5e5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#33b5e5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scanButton: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#33b5e5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
