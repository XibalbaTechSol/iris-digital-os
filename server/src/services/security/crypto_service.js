const crypto = require('crypto');

/**
 * IRIS Digital OS - HIPAA Crypto Service
 * Goal: Encrypt PHI (SSN, MCI) at the field level.
 */
class CryptoService {
    constructor() {
        // In production, these should be in process.env
        this.algorithm = 'aes-256-gcm';
        this.masterKey = Buffer.from('8b7a6d5c4e3f2a1b0d9c8b7a6d5c4e3f2a1b0d9c8b7a6d5c4e3f2a1b0d9c8b7a', 'hex');
        this.ivLength = 16;
        this.tagLength = 16;
    }

    /**
     * Encrypt a sensitive string (e.g., SSN).
     */
    encrypt(text) {
        if (!text) return null;
        
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        // Return structured string: [iv]:[authTag]:[encryptedData]
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Decrypt a sensitive string.
     */
    decrypt(encryptedText) {
        if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
        
        try {
            const [ivHex, tagHex, encryptedData] = encryptedText.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            console.log('[CRYPTO_SERVICE] PHI_DECRYPT_AUDITED_ACCESS');
            return decrypted;
        } catch (err) {
            console.error('[CRYPTO_SERVICE] DECRYPTION_FAILED:', err.message);
            return '[ENCRYPTED_DATA_CORRUPT]';
        }
    }
}

module.exports = new CryptoService();
