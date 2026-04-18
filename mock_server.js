/**
 * IRIS Digital OS - Zero-Dependency Mock Server
 * Goal: Serve all IRIS APIs using native Node.js 'http' for validation.
 * UPDATED: Includes Sandata v7.6 EVV Endpoints.
 */

const http = require('http');

const PORT = 3000;

const routes = {
    '/health': () => ({ status: 'active', domain: 'IRIS_DIGITAL_OS', mode: 'ZERO_DEP_MOCK' }),
    '/api/v1/admin/stats': () => ({
        success: true,
        auditLogs: { total: 9842, integrity: 'SHA-256_MATCH' },
        serviceBus: { status: 'HEALTHY', queueSize: 0 },
        tenants: [{ id: 'PREMIER-FEA', users: 1240 }, { id: 'CONNECTIONS-ICA', users: 850 }]
    }),
    '/api/v1/ops/star-rating': () => ({
        success: true,
        predictedRating: "4.8",
        recommendation: "Excellent: On track for 5-star rating."
    }),
    '/api/v1/ops/justification': () => ({
        success: true,
        form_f01689_draft: { justification: "Participant requires 1:1 supervision due to advanced dementia and frequent nocturnal wandering." }
    }),
    '/api/v1/fintech/liquidity/WORKER-123': () => ({
        availableToday: "142.50",
        status: "ELIGIBLE"
    }),
    '/api/v1/ai/audit': () => ({
        success: true,
        star_prediction: 4.8,
        status: 'PASS',
        feedback: ["✓ Person-centered", "✓ Goal linked"]
    }),
    '/api/v1/incidents/active': () => ({
        success: true,
        incidents: [{ id: 'INC-A1B2', type: 'ABUSE_NEGLECT', status: 'CRITICAL', reported_at: '2026-04-15' }]
    }),
    '/api/v1/incidents/analyze': () => ({
        success: true,
        classification: 'FALL_REPORT',
        complianceCheck: { pass: false, missingDetails: ['WITNESS_IDENTIFICATION'] }
    }),
    '/api/v1/ai/scribe': () => ({
        success: true,
        structuredDraft: "PARTICIPANT CHOICE: Jane Doe leading. GOAL: Independence.",
        entities: { participantName: "Jane Doe", workerName: "John Smith" }
    }),
    '/api/v1/ai/map-pdf': () => ({
        template: 'IRIS 40-Hour Exception Request',
        mappedData: { 'ParticipantName[0]': 'Jane Doe', 'WorkerName[0]': 'John Smith' },
        burnStatus: 'READY_TO_STAMP'
    }),
    '/api/v1/evv/submit': () => ({
        success: true,
        message: "Visit accepted and queued for Sandata aggregator.",
        transactionId: `SAND-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    })
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tenant-id');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const handler = routes[req.url];
        if (handler) {
            res.writeHead(200);
            res.end(JSON.stringify(handler()));
        } else {
            if (req.url.startsWith('/api/v1/fintech/liquidity/')) {
                res.writeHead(200);
                res.end(JSON.stringify(routes['/api/v1/fintech/liquidity/WORKER-123']()));
                return;
            }
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[32m[SANDATA-MOCK] IRIS Digital OS running on port ${PORT}\x1b[0m`);
});
