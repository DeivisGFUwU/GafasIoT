export interface SoundConfig {
    label: string;
    priority: 'rojo' | 'amarillo' | 'verde';
    icon: string;
}

export const SOUND_MAP: Record<string, SoundConfig> = {
    // --- PELIGRO (ROJO) ---
    'SIREN': { label: 'Sirena', priority: 'rojo', icon: 'alert-circle' },
    'siren': { label: 'Sirena', priority: 'rojo', icon: 'alert-circle' },
    'sirena': { label: 'Sirena', priority: 'rojo', icon: 'alert-circle' }, // Spanish support
    'CAR_HORN': { label: 'Claxon', priority: 'rojo', icon: 'car' },
    'car_horn': { label: 'Claxon', priority: 'rojo', icon: 'car' },
    'claxon': { label: 'Claxon', priority: 'rojo', icon: 'car' }, // Spanish support

    // --- RUIDO (VERDE - Info) ---
    'DRILLING': { label: 'Obras', priority: 'verde', icon: 'hammer' },
    'drilling': { label: 'Obras', priority: 'verde', icon: 'hammer' },
    'ENGINE_IDLING': { label: 'Motor', priority: 'verde', icon: 'truck' },
    'engine_idling': { label: 'Motor', priority: 'verde', icon: 'truck' },
    'AIR_CONDITIONER': { label: 'Aire Acond.', priority: 'verde', icon: 'fan' },
    'air_conditioner': { label: 'Aire Acond.', priority: 'verde', icon: 'fan' },

    // --- FUTURO (AMARILLO) ---
    'voice': { label: 'Voz Detectada', priority: 'amarillo', icon: 'mic' },
    'human_voice': { label: 'Voz Detectada', priority: 'amarillo', icon: 'mic' }
};
