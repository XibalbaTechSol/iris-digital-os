/**
 * IRIS Digital OS - True Time Service (Task 8.1 / 6.3)
 * Goal: Prevent time-travel fraud by calculating the delta between device clock and server time.
 */

let timeOffset = 0; // ms

/**
 * Initializes the offset using a trusted NTP server or our own API.
 * Called at app startup when online.
 */
export const syncTrueTime = async (serverApi) => {
    const start = Date.now();
    try {
        const { serverTime } = await serverApi.get('/health/time');
        const latency = (Date.now() - start) / 2;
        timeOffset = (new Date(serverTime).getTime() + latency) - Date.now();
        console.log(`[TRUE_TIME] Synced. Device clock offset: ${timeOffset}ms`);
    } catch (e) {
        console.warn("[TRUE_TIME] Failed to sync server time. Using device clock (at-risk).");
    }
};

/**
 * Returns a fraud-resistant UTC ISO string.
 */
export const getTrueTime = async () => {
    const trueMs = Date.now() + timeOffset;
    return new Date(trueMs).toISOString();
};
