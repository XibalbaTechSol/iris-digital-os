/**
 * IRIS Digital OS - Tenant Middleware (Task 1.5)
 * Goal: Identify and Isolate Agency Data (e.g., Connections vs Premier).
 */

const tenantMiddleware = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id']; // Mandatory header for SaaS isolation

    if (!tenantId) {
        return res.status(403).json({ 
            error: "Tenant Identification Missing", 
            message: "All requests must include an X-Tenant-Id header for security and data isolation." 
        });
    }

    // Attach tenant context to the request for controllers to use in DB queries
    req.tenantId = tenantId;
    next();
};

module.exports = tenantMiddleware;
