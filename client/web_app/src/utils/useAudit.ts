import { useCallback } from 'react';

/**
 * IRIS Digital OS - Security Audit Hook
 * Goal: Streamline reporting of user interactions to the back-end Audit Service.
 */
export const useAudit = () => {
    const logAction = useCallback(async (action: string, moduleId: string, metadata: any = {}) => {
        try {
            console.log(`[AUDIT] LOGGING_${action}_IN_${moduleId}...`);
            await fetch('/api/v1/security/audit', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'DEMO_USER_01' // In production, this would be from Auth context
                },
                body: JSON.stringify({ action, moduleId, metadata })
            });
        } catch (e) {
            console.error('[AUDIT_ERROR] FAILED_TO_REPORT:', e);
        }
    }, []);

    return { logAction };
};
