export interface SoundConfig {
    label: string;
    priority: 'rojo' | 'amarillo' | 'verde';
    icon: string;
}

export const SOUND_MAP: Record<string, SoundConfig> = {
    // --- PELIGRO (ROJO) ---
    'SIREN': { label: 'Sirena', priority: 'rojo', icon: 'alert-circle' },
    'CAR_HORN': { label: 'Claxon', priority: 'rojo', icon: 'car' },

    // --- INFORMATIVO / RUIDO (VERDE) ---
    'DRILLING': { label: 'Obras/Taladro', priority: 'verde', icon: 'hammer' },
    'AIR_CONDITIONER': { label: 'Aire Acond.', priority: 'verde', icon: 'fan' },
    'ENGINE_IDLING': { label: 'Motor Auto', priority: 'verde', icon: 'truck' },

    // --- SOCIAL (Mantenemos esto para el futuro/demo) ---
    'voice': { label: 'Voz', priority: 'amarillo', icon: 'mic' },
    'human_voice': { label: 'Voz', priority: 'amarillo', icon: 'mic' }
};
