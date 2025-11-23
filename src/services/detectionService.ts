import { supabase } from './supabaseClient';
import { DETECTIONS_TABLE } from '../utils/supabaseConfig';
import { Detection } from '../types';

import { SOUND_MAP } from '../config/soundMapping';

// Payload from IoT device (Internal App Format)
export interface DetectionPayload {
    id?: string;
    timestamp: number; // Unix timestamp in seconds
    tipo: string;
    prioridad: 'rojo' | 'amarillo' | 'verde';
    direccion: 'izquierda' | 'derecha' | 'frente' | 'atrás' | 'arriba';
    intensidad: number;
    modo: 'online' | 'offline';
    fuente: string;
    extra?: any;
}

export const detectionService = {
    /**
     * Adapts the raw firmware JSON to the App's DetectionPayload format.
     * Firmware Format: { "top": string, "lado": string, "conf": number }
     */
    adaptFirmwarePayload(raw: any): DetectionPayload {
        if (!raw || typeof raw !== 'object') {
            throw new Error('Invalid raw payload: must be an object');
        }

        // Try to find the sound config with case-insensitive lookup
        const rawTop = raw.top;
        let config = SOUND_MAP[rawTop]; // Try exact match first

        if (!config) {
            // Try lowercase
            const topLower = rawTop?.toLowerCase();
            config = SOUND_MAP[topLower];
        }

        if (!config) {
            // Try uppercase
            const topUpper = rawTop?.toUpperCase();
            config = SOUND_MAP[topUpper];
        }

        // Fallback
        if (!config) {
            console.warn(`Sound "${rawTop}" not found in SOUND_MAP, using fallback`);
            config = { label: 'Ruido', priority: 'verde', icon: 'help-circle' };
        }

        console.log(`DetectionService: Mapped "${rawTop}" -> priority: ${config.priority}, label: ${config.label}`);

        // Map direction
        const directionMap: Record<string, string> = {
            'izquierda': 'izquierda',
            'derecha': 'derecha',
            'centro': 'frente',
            'atras': 'atrás'
        };
        const direccion = directionMap[raw.lado?.toLowerCase()] || 'frente';

        return {
            timestamp: Math.floor(Date.now() / 1000),
            tipo: config.label.toLowerCase(), // Use label as type for now (e.g. "sirena")
            prioridad: config.priority,
            direccion: direccion as any,
            intensidad: raw.conf || 0.5,
            modo: 'online',
            fuente: 'esp32',
            extra: { raw_top: raw.top }
        };
    },

    /**
     * Validates and parses the raw JSON payload from the ESP32.
     * DEPRECATED: Use adaptFirmwarePayload for new firmware.
     */
    parsePayload(json: any): DetectionPayload {
        // Legacy support or direct internal usage
        return json as DetectionPayload;
    },

    /**
     * Maps payload to database format
     */
    mapToSupabase(payload: DetectionPayload): any {
        return {
            ...(payload.id ? { id: payload.id } : {}),
            tipo: payload.tipo,
            prioridad: payload.prioridad,
            direccion: payload.direccion,
            intensidad: payload.intensidad,
            frecuencia_dominante: payload.extra?.frecuencia_dominante ?? null,
            timestamp: new Date(payload.timestamp * 1000).toISOString(),
            procesado: false,
        };
    },

    /**
     * Inserts a detection into Supabase
     */
    async insertDetection(payload: DetectionPayload): Promise<Detection> {
        const row = this.mapToSupabase(payload);

        const { data, error } = await supabase
            .from(DETECTIONS_TABLE)
            .insert([row])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        return data[0] as Detection;
    },

    /**
     * Fetches recent detections
     */
    async fetchRecent(limit = 20): Promise<Detection[]> {
        const { data, error } = await supabase
            .from(DETECTIONS_TABLE)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase fetch error:', error);
            throw error;
        }

        return data as Detection[];
    }
};
