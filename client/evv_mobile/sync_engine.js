/**
 * IRIS Digital OS - EVV Sync Engine (Task 8.1)
 * Goal: Solve the "Evvie/Sandata Data Loss" crisis.
 * Logic: Persistent queue for Clock-In/Clock-Out events with exponential backoff.
 */

import { getTrueTime } from './true_time';

class EVVSyncEngine {
    constructor() {
        this.queue = [];
        this.isSyncing = false;
        this.retryDelay = 1000; // ms
    }

    /**
     * Captures a shift event (CLOCK_IN/OUT) with verified True Time.
     */
    async captureEvent(type, workerId, participantId, gps) {
        const timestamp = await getTrueTime();
        const event = {
            id: `EVV_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type, // 'CLOCK_IN' | 'CLOCK_OUT'
            workerId,
            participantId,
            gps,
            timestamp,
            capturedAt: new Date().toISOString(),
            status: 'PENDING',
            retries: 0
        };

        // 1. Persistent Storage (Simplified here, in Prod use AsyncStorage/IndexedDB)
        this.queue.push(event);
        console.log(`[EVV_SYNC] Event captured: ${type} at ${timestamp}. Queue size: ${this.queue.length}`);
        
        // 2. Trigger async sync
        this.triggerSync();
        return event;
    }

    /**
     * Orchestrates the sync process.
     */
    async triggerSync() {
        if (this.isSyncing || this.queue.length === 0) return;
        this.isSyncing = true;

        console.log(`[EVV_SYNC] Processing queue... (${this.queue.length} pending)`);

        while (this.queue.length > 0) {
            const event = this.queue[0];
            
            try {
                const success = await this.sendToServer(event);
                if (success) {
                    this.queue.shift(); // Remove on success
                    this.retryDelay = 1000; // Reset backoff
                } else {
                    throw new Error("Server rejected event");
                }
            } catch (err) {
                console.error(`[EVV_SYNC] Sync failed for ${event.id}:`, err.message);
                this.applyBackoff();
                break; // Stop and retry later
            }
        }

        this.isSyncing = false;
    }

    /**
     * Sends the event to the IRIS Digital OS Gateway.
     */
    async sendToServer(event) {
        // Mock network call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate 90% success rate to test logic
                const ok = Math.random() > 0.1;
                resolve(ok);
            }, 500);
        });
    }

    applyBackoff() {
        this.retryDelay = Math.min(this.retryDelay * 2, 60000); // Max 1 minute
        setTimeout(() => this.triggerSync(), this.retryDelay);
        console.log(`[EVV_SYNC] Retrying in ${this.retryDelay}ms...`);
    }
}

export const evvSync = new EVVSyncEngine();
