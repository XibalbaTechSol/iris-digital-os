const fs = require('fs');
const path = require('path');
const db = require('../database/database');

const uploadDirectory = path.join(__dirname, '..', 'assets', 'vault');

// Ensure directory exists
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const receiveUpload = async (req, res) => {
    try {
        const { fileName, fileType, fileData, participant } = req.body;
        
        if (!fileName || !fileData) {
            return res.status(400).json({ success: false, error: 'Missing file data' });
        }

        // Generate unique name and decode base64
        const docId = `DOC-${Date.now()}`;
        const ext = path.extname(fileName) || '.bin';
        const secureFileName = `${docId}${ext}`;
        const filePath = path.join(uploadDirectory, secureFileName);
        
        // Write file
        const buffer = Buffer.from(fileData, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Save metadata to database (simulating DB insertion)
        console.log(`[VAULT_CTRL] Saved document securely to: ${filePath}`);

        res.json({
            success: true,
            docId,
            participant,
            fileName: secureFileName
        });
    } catch (err) {
        console.error('[VAULT_CTRL] Error saving document', err);
        res.status(500).json({ success: false, error: 'Failed to securely store document' });
    }
};

module.exports = {
    receiveUpload
};
