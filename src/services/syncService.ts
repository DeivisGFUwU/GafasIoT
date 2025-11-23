import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabaseClient';
import { queueService } from './queueService';

export const syncService = {
    /**
     * Checks for internet connection and syncs pending detections if online.
     */
    async syncPendingDetections(): Promise<void> {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            console.log('Offline: Skipping sync.');
            return;
        }

        const pending = await queueService.getPending();
        if (pending.length === 0) {
            console.log('No pending detections to sync.');
            return;
        }

        console.log(`Syncing ${pending.length} detections...`);

        // Insert into Supabase
        const { error } = await supabase
            .from('detections')
            .insert(pending);

        if (error) {
            console.error('Error syncing detections to Supabase:', error);
            return;
        }

        // If successful, remove from offline storage
        await queueService.removeDetections(pending);
        console.log('Sync complete.');
    },

    /**
     * Starts monitoring network state to trigger sync automatically when online.
     */
    startMonitoring(): void {
        NetInfo.addEventListener(state => {
            if (state.isConnected) {
                this.syncPendingDetections();
            }
        });
    }
};
