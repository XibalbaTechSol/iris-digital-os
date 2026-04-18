/**
 * IRIS Digital OS - Background Check Service (Automation Phase)
 * Pattern: Checkr / First Advantage Proxy
 * Goal: Automate worker screening and emit status events.
 */

const ServiceBus = require('../orchestration/service_bus');

class BackgroundCheckService {
    constructor() {
        this.init();
    }

    init() {
        console.log('[COMPLIANCE] BG_CHECK_SERVICE_ACTIVE: Monitoring recruitment pipeline.');
    }

    /**
     * Trigger an automated background check.
     * In production, this hits Checkr/Sterling APIs.
     */
    async triggerAutomatedCheck(workerId, candidateData) {
        console.log(`[BG_CHECK] TRIGGERING_FOR_WORKER: ${workerId}`);
        
        // 1. Mock API call to screening provider
        const screeningResponse = await this.mockScreeningProviderCall(candidateData);
        
        // 2. Publish initial "Pending" status
        ServiceBus.publish('BG_CHECK_PENDING', {
            workerId,
            transactionId: screeningResponse.id,
            provider: 'CHECKR_PROD'
        });

        // 3. Simulate Async Result (Web-hook style)
        setTimeout(() => {
            this.handleScreeningResult(workerId, screeningResponse.status);
        }, 5000);

        return screeningResponse;
    }

    handleScreeningResult(workerId, status) {
        const eventType = status === 'CLEAR' ? 'BG_CHECK_PASSED' : 'BG_CHECK_FLAGGED';
        console.log(`[BG_CHECK] RESULT_RECEIVED for ${workerId}: ${status}`);

        ServiceBus.publish(eventType, {
            workerId,
            verifiedAt: new Date().toISOString(),
            status
        });
    }

    async mockScreeningProviderCall(data) {
        // High-fidelity mock logic
        const isMOCK_REJECT = data.lastName === 'REJECT_TEST';
        return {
            id: `CHR_${Date.now()}`,
            status: isMOCK_REJECT ? 'FLAGGED' : 'CLEAR',
            eta: '2026-04-16T18:00:00Z'
        };
    }
}

module.exports = new BackgroundCheckService();
