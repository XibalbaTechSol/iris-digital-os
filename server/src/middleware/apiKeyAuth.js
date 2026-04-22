const db = require('../config/database');

/**
 * IRIS Digital OS - API Key Authentication Middleware
 * Goal: Secure external HIE/EHR access to clinical resources.
 */
const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({ 
            error: 'MISSING_API_KEY',
            message: 'Unauthorized: X-API-KEY header or api_key query parameter required.' 
        });
    }

    try {
        // In a production environment, we would use bcrypt.compare with hashed keys.
        // For development/mock accuracy, we check the stored key_hash directly.
        const row = await db.query('SELECT * FROM api_keys WHERE key_hash = ?', [apiKey]);

        if (row.length === 0) {
            return res.status(403).json({ 
                error: 'INVALID_API_KEY',
                message: 'Forbidden: The provided API key is invalid or revoked.' 
            });
        }

        // Attach partner identity to request for audit logging
        req.partner = row[0];
        next();
    } catch (err) {
        console.error('[AUTH_ERR]', err);
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};

module.exports = apiKeyAuth;
