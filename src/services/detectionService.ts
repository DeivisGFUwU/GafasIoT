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

// Mapeo de códigos cortos del ESP32
const SOUND_CODE_MAP: Record<string, string> = {
    'Si': 'siren',
    'Ca': 'car_horn',
    'Dr': 'drilling',
    'En': 'engine_idling',
    'Ai': 'air_conditioner',
    'Vz': 'voice',
    'Un': 'unknown'
};

const SIDE_CODE_MAP: Record<string, string> = {
    'Iz': 'izquierda',
    'Der': 'derecha',
    'Ce': 'frente'
};

export const detectionService = {
    /**
     * Adapts the raw firmware JSON to the App's DetectionPayload format.
     * NEW Format: { "S": "Si", "L": "Iz" }
     * OLD Format: { "top": "siren", "lado": "izquierda", "conf": 0.8 }
     */
    adaptFirmwarePayload(raw: any): DetectionPayload {
        if (!raw || typeof raw !== 'object') {
            throw new Error('Invalid raw payload: must be an object');
        }

        let soundKey: string;
        let sideKey: string;
        let confidence = 0.5;

        // Check if it's the NEW format ({"S":"Si","L":"Iz"})
        if (raw.S && raw.L) {
            console.log('🆕 [DetectionService] New format detected:', raw);

            // Map short codes to full names
            soundKey = SOUND_CODE_MAP[raw.S] || raw.S;
            sideKey = SIDE_CODE_MAP[raw.L] || 'frente';

            console.log(`📍 [DetectionService] Mapped: S="${raw.S}" → "${soundKey}", L="${raw.L}" → "${sideKey}"`);
        }
        // OLD format ({"top":"siren","lado":"izquierda"})
        else if (raw.top || raw.sound) {
            console.log('📜 [DetectionService] Old format detected:', raw);
            soundKey = raw.top || raw.sound;
            sideKey = raw.lado || raw.side || 'frente';
            confidence = raw.conf || 0.5;
        }
        else {
            throw new Error('Unknown payload format');
        }

        // Find sound config
        let config = SOUND_MAP[soundKey]; // Try exact match first

        if (!config) {
            // Try lowercase
            const soundLower = soundKey?.toLowerCase();
            config = SOUND_MAP[soundLower];
        }

        if (!config) {
            // Try uppercase
            const soundUpper = soundKey?.toUpperCase();
            config = SOUND_MAP[soundUpper];
        }

        // Fallback
        if (!config) {
            console.warn(`⚠️ [DetectionService] Sound "${soundKey}" not found in SOUND_MAP, using fallback`);
            config = { label: 'Ruido', priority: 'verde', icon: 'help-circle' };
        }

        console.log(`✅ [DetectionService] Final mapping: "${soundKey}" → priority: ${config.priority}, label: ${config.label}`);

        // Map direction
        const directionMap: Record<string, string> = {
            'izquierda': 'izquierda',
            'derecha': 'derecha',
            'centro': 'frente',
            'frente': 'frente',
            'atras': 'atrás'
        };
        const direccion = directionMap[sideKey?.toLowerCase()] || 'frente';

        return {
            timestamp: Math.floor(Date.now() / 1000),
            tipo: config.label.toLowerCase(), // Use label as type for now (e.g. "sirena")
            prioridad: config.priority,
            direccion: direccion as any,
            intensidad: confidence,
            modo: 'online',
            fuente: 'esp32',
            extra: { raw_sound: soundKey, raw_side: sideKey }
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
