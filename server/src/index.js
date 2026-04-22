require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const initializeDatabase = require('./config/init_db');

// Route Imports
const adminRoutes = require('./routes/adminRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const evvRoutes = require('./routes/evvRoutes');
const billingRoutes = require('./routes/billingRoutes');
const icaRoutes = require('./routes/icaRoutes');
const fintechRoutes = require('./routes/fintechRoutes');
const aiRoutes = require('./routes/aiRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const securityRoutes = require('./routes/securityRoutes');
const caseRoutes = require('./routes/caseRoutes');
const documentRoutes = require('./routes/documentRoutes');
const handoffRoutes = require('./routes/handoffRoutes');
const alertRoutes = require('./routes/alertRoutes');
const interopRoutes = require('./routes/interopRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const mobileRoutes = require('./routes/mobileRoutes');
const marketingRoutes = require('./routes/marketingRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

// Mock Tenant Middleware
app.use((req, res, next) => {
    req.tenantId = req.headers['x-tenant-id'] || 'MOCK-TENANT';
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'active', 
        domain: 'IRIS_DIGITAL_OS', 
        mode: 'MOCK',
        timestamp: new Date().toISOString()
    });
});

// Route Mounting
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/evv', evvRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/ops', icaRoutes);
app.use('/api/v1/fintech', fintechRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/case', caseRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/handoff', handoffRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/interop', interopRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/mobile', mobileRoutes);
app.use('/api/v1/auth/mobile', mobileRoutes); // Auth routes are in mobileRoutes
app.use('/api/v1/marketing', marketingRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
const start = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            logger.info(`IRIS Digital OS (MOCK MODE) running on port ${PORT}`);
            logger.info(`API Endpoints mounted with Medicaid LTSS Architecture`);
        });
    } catch (err) {
        logger.error('Failed to start server: ' + err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}

module.exports = app;
