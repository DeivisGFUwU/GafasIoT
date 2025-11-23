import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@offline_detections_queue';

export const queueService = {
    /**
     * Saves a detection to the offline queue.
     */
    async saveDetection(detection: any): Promise<void> {
        try {
            const existing = await this.getPending();
            const updated = [...existing, detection];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving offline detection:', error);
        }
    },

    /**
     * Retrieves all pending detections from the queue.
     */
    async getPending(): Promise<any[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            return json != null ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error reading offline detections:', error);
            return [];
        }
    },

    /**
     * Removes specific detections from the queue.
     */
    async removeDetections(detectionsToRemove: any[]): Promise<void> {
        try {
            const current = await this.getPending();
            const filtered = current.filter(
                item => !detectionsToRemove.some(
                    rem => rem.timestamp === item.timestamp && rem.tipo === item.tipo
                )
            );
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error removing offline detections:', error);
        }
    },

    /**
     * Clears the entire queue.
     */
    async clearQueue(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing offline queue:', error);
        }
    }
};
