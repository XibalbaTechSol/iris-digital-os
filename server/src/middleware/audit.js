/**
 * IRIS Digital OS - Audit Log Service (Task 1.4)
 * Goal: Track every mutation for State/HIPAA Compliance.
 */

const logAction = async (pool, { userId, action, tableName, recordId, oldValue, newValue }) => {
    const query = `
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    try {
        await pool.query(query, [
            userId, 
            action, 
            tableName, 
            recordId, 
            JSON.stringify(oldValue), 
            JSON.stringify(newValue)
        ]);
    } catch (error) {
        console.error('[AUDIT] Failed to log action:', error);
    }
};

module.exports = { logAction };
