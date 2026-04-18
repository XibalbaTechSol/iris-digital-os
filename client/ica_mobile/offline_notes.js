/**
 * IRIS Digital OS - Offline-First Field App (Task 5.5)
 * Component: Consultant Case Notes (React Native Logic)
 * Goal: Allow rural consultants to capture visit data without cell service.
 */

import { saveToIndexedDB, getFromIndexedDB, syncWithServer } from './db_utils';

const CaseNoteService = {
    /**
     * Captures a visit note and stores it locally if offline.
     */
    async saveVisitNote(noteData) {
        const payload = {
            id: `NOTE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            content: noteData.content,
            participantId: noteData.participantId,
            gps: noteData.gps, // Verified via device GPS
            synced: false
        };

        try {
            // 1. Try server sync
            if (navigator.onLine) {
                const response = await fetch('/api/ica/notes', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    payload.synced = true;
                    console.log("[OFFLINE_APP] Note synced to WISITS directly.");
                }
            }
        } catch (e) {
            console.warn("[OFFLINE_APP] Offline detected. Queuing note locally...");
        }

        // 2. Always store in local IndexedDB as backup
        await saveToIndexedDB('visit_notes', payload);
        return payload;
    },

    /**
     * Background job to sync pending notes when connection is restored.
     */
    async startBackgroundSync() {
        window.addEventListener('online', async () => {
            console.log("[OFFLINE_APP] Connection restored. Syncing pending notes...");
            const pending = await getFromIndexedDB('visit_notes', { synced: false });
            
            for (const note of pending) {
                const success = await syncWithServer(note);
                if (success) {
                    note.synced = true;
                    await saveToIndexedDB('visit_notes', note);
                }
            }
        });
    }
};

export default CaseNoteService;
