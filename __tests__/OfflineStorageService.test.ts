import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueService } from '../src/services/queueService';
import { Detection } from '../src/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('queueService', () => {
    const mockDetection: any = {
        tipo: 'sirena',
        prioridad: 'rojo',
        direccion: 'izquierda',
        intensidad: 0.9,
        timestamp: '2024-11-10T12:00:00.000Z',
        procesado: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save a detection to the queue', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        await queueService.saveDetection(mockDetection);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            '@offline_detections_queue',
            JSON.stringify([mockDetection])
        );
    });

    it('should append to existing queue', async () => {
        const existing = [{ ...mockDetection, tipo: 'voz' }];
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));

        await queueService.saveDetection(mockDetection);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            '@offline_detections_queue',
            JSON.stringify([...existing, mockDetection])
        );
    });

    it('should retrieve pending detections', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockDetection]));
        const result = await queueService.getPending();
        expect(result).toEqual([mockDetection]);
    });

    it('should return empty array if storage is empty', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        const result = await queueService.getPending();
        expect(result).toEqual([]);
    });

    it('should remove specific detections', async () => {
        const item1 = { ...mockDetection, tipo: 'sirena' };
        const item2 = { ...mockDetection, tipo: 'voz' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([item1, item2]));

        await queueService.removeDetections([item1]);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            '@offline_detections_queue',
            JSON.stringify([item2])
        );
    });
});
