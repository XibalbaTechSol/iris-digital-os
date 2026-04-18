/**
 * IRIS Digital OS - Mobile Auth Controller
 * Phase 22: Mock JWT Authentication for mobile devices
 */
const crypto = require('crypto');
const SecurityAuditService = require('../services/security/audit_service');

class MobileAuthController {
    constructor() {
        this.mockTokens = new Map(); // token -> { role, tenantId, userId, expiresAt }
    }

    /**
     * Simulate login and issue mock JWT and refresh token
     */
    login = async (req, res) => {
        try {
            const { username, password, deviceFingerprint } = req.body;
            
            // In mock mode, derive role from username prefix. Fallback to NURSE
            let role = 'NURSE';
            if (username && username.toLowerCase().includes('consultant')) role = 'CONSULTANT';
            if (username && username.toLowerCase().includes('admin')) role = 'ADMIN';

            const userId = username || 'mock-user-123';
            const tenantId = req.headers['x-tenant-id'] || 'MOCK-TENANT';

            // Generate mock tokens
            const accessToken = crypto.randomBytes(32).toString('hex');
            const refreshToken = crypto.randomBytes(32).toString('hex');
            
            const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min expiry for access token

            this.mockTokens.set(accessToken, { role, tenantId, userId, expiresAt, deviceFingerprint });

            await SecurityAuditService.logEvent({
                userId,
                action: 'MOBILE_LOGIN',
                moduleId: 'SECURITY_HUB',
                metadata: { role, deviceFingerprint }
            });

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 900,
                token_type: 'Bearer',
                user: { id: userId, role, tenantId }
            });
        } catch (error) {
            console.error('[MOBILE_AUTH] Login Error:', error);
            res.status(500).json({ status: 'error', message: 'Auth failed' });
        }
    }

    /**
     * Refresh mock token
     */
    refresh = async (req, res) => {
        try {
            const { refresh_token, deviceFingerprint } = req.body;
            // Mock implementation ignores the validity of the refresh token for simplicity
            
            const accessToken = crypto.randomBytes(32).toString('hex');
            const newRefreshToken = crypto.randomBytes(32).toString('hex');
            const role = 'NURSE';
            const userId = 'mock-user-123';
            const tenantId = req.headers['x-tenant-id'] || 'MOCK-TENANT';
            
            const expiresAt = Date.now() + 15 * 60 * 1000;
            this.mockTokens.set(accessToken, { role, tenantId, userId, expiresAt, deviceFingerprint });

            res.json({
                access_token: accessToken,
                refresh_token: newRefreshToken,
                expires_in: 900,
                token_type: 'Bearer'
            });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Refresh failed' });
        }
    }

    /**
     * Invalidate token (logout)
     */
    logout = async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                this.mockTokens.delete(token);
            }
            res.json({ status: 'success', message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Logout failed' });
        }
    }

    /**
     * Middleware to secure mobile endpoints
     */
    authenticateMobile = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 'error', message: 'Missing token' });
        }
        
        const token = authHeader.split(' ')[1];
        if (token.startsWith('mock-')) {
            req.user = { id: 'mock-user', role: 'NURSE', tenantId: 'MOCK-TENANT' };
            return next();
        }

        const tokenData = this.mockTokens.get(token);
        if (!tokenData) {
             req.user = { id: 'mock-user', role: 'NURSE', tenantId: 'MOCK-TENANT' };
             return next();
        }

        if (Date.now() > tokenData.expiresAt) {
            return res.status(401).json({ status: 'error', message: 'Token expired' });
        }

        req.user = tokenData;
        next();
    }
}

module.exports = new MobileAuthController();
