import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Detection } from '../types';
import { DetectionPayload, detectionService } from '../services/detectionService';
import { notificationService } from '../services/notificationService';
import { useApp } from './AppContext';

interface AlertContextProps {
    currentAlert: Detection | null;
    triggerAlert: (payload: DetectionPayload) => Promise<void>;
    clearAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentAlert, setCurrentAlert] = useState<Detection | null>(null);
    const { isTranscribing } = useApp();

    // Use a ref to track isTranscribing to avoid stale closures in callbacks (like DemoService)
    const isTranscribingRef = React.useRef(isTranscribing);

    // Throttling Ref: Stores timestamp of last alert per type+direction
    const lastAlertsRef = React.useRef<Record<string, number>>({});

    useEffect(() => {
        isTranscribingRef.current = isTranscribing;
        console.log('AlertContext: isTranscribing updated to', isTranscribing);
    }, [isTranscribing]);

    const triggerAlert = async (payload: DetectionPayload) => {
        // --- SUPPRESSION LOGIC ---
        // Use ref.current to get the latest value even if triggerAlert was captured in a closure
        if (isTranscribingRef.current) {
            if (payload.prioridad !== 'rojo') {
                console.log('SUPPRESSED: User is transcribing and alert is not red.');
                return; // SILENCE
            }
            console.log('CRITICAL OVERRIDE: Danger detected during transcription!');
            // Proceed to alert
        }
        // -------------------------

        // --- THROTTLING LOGIC ---
        const now = Date.now();
        const throttleKey = `${payload.tipo}_${payload.direccion}`;
        const lastTime = lastAlertsRef.current[throttleKey] || 0;
        const THROTTLE_DURATION = 3000; // 3 seconds

        if (now - lastTime < THROTTLE_DURATION) {
            console.log(`🚫 [AlertContext] Throttled duplicate alert: ${throttleKey} (Last: ${now - lastTime}ms ago)`);
            return;
        }

        // Update timestamp for this alert type
        lastAlertsRef.current[throttleKey] = now;
        // ------------------------

        try {
            const newDetection = await detectionService.insertDetection(payload);

            // Visual & Haptic Alert
            setCurrentAlert(newDetection);
            await notificationService.triggerAlert(newDetection);

            // Auto-clear alert after 5 seconds
            setTimeout(() => {
                setCurrentAlert(null);
            }, 5000);

        } catch (e) {
            console.error('Error triggering alert:', e);
        }
    };

    const clearAlert = () => {
        setCurrentAlert(null);
    };

    return (
        <AlertContext.Provider value={{ currentAlert, triggerAlert, clearAlert }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
