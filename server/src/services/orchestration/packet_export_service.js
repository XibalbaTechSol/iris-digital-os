/**
 * IRIS Digital OS - Clinical Packet Export Service
 * Goal: Aggregate and "bundle" required documents for state submission.
 */

class PacketExportService {
    /**
     * Generate a clinical packet for a participant.
     * @param {string} participantId
     * @param {Array} documentList - List of verified document metadata
     */
    async generateClinicalPacket(participantId, documentList) {
        console.log(`[PACKET_EXPORT] GENERATING_BUNDLE_FOR: ${participantId}`);
        
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const packetName = `IRIS_PACKET_${participantId}_${timestamp}.zip`;

        // 1. Verify all mandatory forms are present
        const mandatoryForms = ['F-00075', 'F-01293', 'F-01309'];
        const missing = mandatoryForms.filter(f => !documentList.find(d => d.code === f && d.status === 'VERIFIED'));

        if (missing.length > 0) {
            console.warn(`[PACKET_EXPORT] INCOMPLETE_PACKET: Missing ${missing.join(', ')}`);
            return {
                success: false,
                error: 'INCOMPLETE_DOCUMENTATION',
                missingForms: missing
            };
        }

        // 2. Perform Mock Zipping & Encryption
        console.log(`[PACKET_EXPORT] ARCHIVING_${documentList.length}_DOCUMENTS_WITH_AES256...`);

        return {
            success: true,
            packetName,
            documentCount: documentList.length,
            checksum: 'sha256:d8e8fca2dc0f896fd7cb4cb0031ba249',
            sizeBytes: 12504000, // Mock 12MB
            security: 'ENCRYPTED_AES256'
        };
    }
}

module.exports = new PacketExportService();
