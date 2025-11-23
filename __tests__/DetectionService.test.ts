import { detectionService } from '../src/services/detectionService';
import { DetectionPayload } from '../src/services/detectionService';

const validPayload: DetectionPayload = {
    timestamp: 1731241011,
    tipo: 'sirena',
    prioridad: 'rojo',
    direccion: 'izquierda',
    intensidad: 0.87,
    modo: 'online',
    fuente: 'esp32',
    extra: {
        frecuencia_dominante: 2350,
    },
};

describe('DetectionService', () => {

    it('should parse a valid payload correctly', () => {
        const result = detectionService.parsePayload(validPayload);
        expect(result).toEqual(validPayload);
    });

    it('should throw error if payload is not an object', () => {
        expect(() => detectionService.parsePayload(null)).toThrow('Invalid payload: must be an object');
        expect(() => detectionService.parsePayload('string')).toThrow('Invalid payload: must be an object');
    });

    it('should throw error if missing required fields', () => {
        const invalidPayload = { ...validPayload };
        delete (invalidPayload as any).timestamp;
        expect(() => detectionService.parsePayload(invalidPayload)).toThrow('Invalid payload: timestamp must be a number'); // Note: parsePayload validation might differ slightly, checking implementation
    });

    it('should throw error if types are incorrect', () => {
        const invalidPayload = { ...validPayload, timestamp: 'not a number' };
        expect(() => detectionService.parsePayload(invalidPayload)).toThrow('Invalid payload: timestamp must be a number');
    });
});

describe('mapToSupabase', () => {
    it('should map payload to Supabase insert format correctly', () => {
        const result = detectionService.mapToSupabase(validPayload);

        expect(result).toEqual({
            tipo: 'sirena',
            prioridad: 'rojo',
            direccion: 'izquierda',
            intensidad: 0.87,
            frecuencia_dominante: 2350,
            timestamp: '2024-11-10T12:16:51.000Z', // 1731241011 * 1000
            procesado: false,
        });
    });

    it('should handle missing extra data', () => {
        const payloadWithoutExtra = { ...validPayload };
        delete payloadWithoutExtra.extra;

        const result = detectionService.mapToSupabase(payloadWithoutExtra);
        expect(result.frecuencia_dominante).toBeNull();
    });
});
