import { generateUUID } from '../utils/uuid';
import { detectionService } from './DetectionService';

export const DemoScenarioService = {
    timeouts: [] as NodeJS.Timeout[],

    runDemo: async (
        alertContext: any,
        appContext: any
    ) => {
        console.log('Starting Demo Scenario...');
        const { setIsBleConnected } = appContext;
        const { triggerAlert } = alertContext;

        // Clear any existing timeouts
        DemoScenarioService.stopDemo();

        // T=0: Simulate Connection
        setIsBleConnected(true);
        console.log('T=0: BLE Connected');

        // Helper to add timeout
        const addStep = (fn: () => void, delay: number) => {
            const id = setTimeout(fn, delay);
            DemoScenarioService.timeouts.push(id);
        };

        // T=2: Green Alert (Info) - Faster start
        addStep(() => {
            console.log('T=2: Green Alert (Raw: bell)');
            const raw = { top: 'bell', lado: 'centro', conf: 0.5 };
            const payload = detectionService.adaptFirmwarePayload(raw);
            payload.id = generateUUID();
            triggerAlert(payload);
        }, 2000);

        // T=10: Yellow Alert (Voice)
        addStep(() => {
            console.log('T=10: Yellow Alert (Raw: human_voice)');
            const raw = { top: 'human_voice', lado: 'derecha', conf: 0.7 };
            const payload = detectionService.adaptFirmwarePayload(raw);
            payload.id = generateUUID();
            triggerAlert(payload);
        }, 10000);

        // T=20: Red Alert (Siren)
        addStep(() => {
            console.log('T=20: Red Alert (Raw: SIREN)');
            const raw = { top: 'SIREN', lado: 'atras', conf: 0.95 };
            const payload = detectionService.adaptFirmwarePayload(raw);
            payload.id = generateUUID();
            triggerAlert(payload);
        }, 20000);
    },

    stopDemo: (setIsBleConnected?: (value: boolean) => void) => {
        console.log('Stopping Demo Scenario...');
        DemoScenarioService.timeouts.forEach(clearTimeout);
        DemoScenarioService.timeouts = [];
        if (setIsBleConnected) {
            setIsBleConnected(false);
        }
    }
};
