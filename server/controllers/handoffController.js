const handoffService = require('../services/orchestration/handoff_service');

/**
 * IRIS Digital OS - Handoff Controller
 */
exports.initiateHandoff = async (req, res) => {
    try {
        const { leadId, targetIca, agentSignature } = req.body;
        const result = await handoffService.initiateHandoff(leadId, targetIca, agentSignature);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.acceptReferral = async (req, res) => {
    try {
        const { referralId, icaWorkerId, acceptanceSignature } = req.body;
        const result = await handoffService.acceptReferral(referralId, icaWorkerId, acceptanceSignature);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.sdpcReferral = async (req, res) => {
    try {
        const { participantId, targetSdpc, icSignature } = req.body;
        const result = await handoffService.initiateSDPCTransfer(participantId, targetSdpc, icSignature);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
