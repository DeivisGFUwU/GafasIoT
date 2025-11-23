import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Vibration, Platform } from 'react-native';
import { Detection } from '../types';

// Vibration Patterns (in milliseconds)
// [wait, vibrate, wait, vibrate...]
const PATTERNS = {
    rojo: [0, 1000], // Long 1s vibration
    amarillo: [0, 200, 100, 200], // Double pulse
    verde: [0, 100], // Short tick
    default: [0, 500],
};

export const notificationService = {
    /**
     * Configure channels and permissions
     */
    async configure() {
        await notifee.requestPermission();

        // Create High Importance Channel for Heads-up alerts
        await notifee.createChannel({
            id: 'alerts',
            name: 'Alertas de Sonido',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        });
    },

    /**
     * Trigger a visual and haptic alert
     */
    async triggerAlert(detection: Detection) {
        const { tipo, prioridad, direccion } = detection;

        // 1. Haptic Feedback (Vibration)
        const pattern = PATTERNS[prioridad] || PATTERNS.default;
        Vibration.vibrate(pattern);

        // 2. System Notification
        await notifee.displayNotification({
            title: `🚨 ${tipo.toUpperCase()} detectado`,
            body: `Dirección: ${direccion.toUpperCase()} | Prioridad: ${prioridad.toUpperCase()}`,
            android: {
                channelId: 'alerts',
                smallIcon: 'ic_launcher', // Uses default app icon for now
                pressAction: {
                    id: 'default',
                },
                importance: AndroidImportance.HIGH,
            },
        });
    }
};
