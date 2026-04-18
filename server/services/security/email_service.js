/**
 * IRIS Digital OS - Email Notification Service
 * Goal: Verifiable delivery of onboarding packets and authorizations.
 */
class EmailService {
    /**
     * Send onboarding packet to Worker.
     */
    async sendIntakePacket(workerEmail, workerName, attachments) {
        console.log(`[EMAIL_SERVICE] SENDING_PACKET_TO: ${workerEmail} (${workerName})`);
        console.log(`[EMAIL_SERVICE] ATTACHMENTS_COUNT: ${attachments.length}`);
        
        // Mocking the SMTP transaction
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    deliveryId: `EML_${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
                    timestamp: new Date().toISOString()
                });
            }, 800);
        });
    }

    /**
     * Notify Participant of Work Order completion.
     */
    async notifyWorkOrder(participantEmail, workOrderId) {
        console.log(`[EMAIL_SERVICE] NOTIFYING_PARTICIPANT: ${participantEmail} // ${workOrderId}`);
        return { success: true };
    }
}

module.exports = new EmailService();
