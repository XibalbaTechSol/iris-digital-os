-- IRIS Digital OS - Global Database Schema (Phase 1.5 Multi-Tenancy Update)
-- Focus: Real-time Budgeting, HIPAA Audit Trails, and Agency Data Isolation

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. Multi-Tenancy Core
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'Connections ICA', 'Premier FMS'
    type VARCHAR(20) CHECK (type IN ('ICA', 'FEA', 'STATE')),
    domain_slug TEXT UNIQUE, -- e.g., 'connections', 'premier'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Core Identity & RBAC
CREATE TYPE user_role AS ENUM ('ADMIN', 'IRIS_CONSULTANT', 'PARTICIPANT', 'CAREGIVER', 'STATE_AUDITOR');

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    state_id TEXT, -- MCI (Master Customer Index) or ForwardHealth ID
    encrypted_ssn TEXT, -- AES-256 encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, state_id)
);

-- 2. Agency & State Enrollment
CREATE TABLE enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    participant_id UUID REFERENCES users(user_id),
    ica_id UUID REFERENCES users(user_id), -- Assigned Consultant
    fea_id UUID, -- Links to Fiscal Employer Agent entity
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PENDING', 'DISENROLLED')) DEFAULT 'PENDING',
    last_state_sync TIMESTAMP WITH TIME ZONE
);

-- 3. Case Management: ISSP (Service Plans)
CREATE TABLE service_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    participant_id UUID REFERENCES users(user_id),
    consultant_id UUID REFERENCES users(user_id),
    version INT DEFAULT 1,
    annual_budget_total DECIMAL(12,2) NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    document_url TEXT, -- Path to P-01032 named PDF in S3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE service_authorizations (
    auth_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    plan_id UUID REFERENCES service_plans(plan_id),
    service_code VARCHAR(10) NOT NULL, -- e.g., T1019, S5125
    units_authorized DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(10) CHECK (unit_type IN ('HOURS', 'FLAT_FEE', 'MILES')),
    total_dollar_limit DECIMAL(12,2),
    vendor_id UUID,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. FEA Engine: Budgets & Real-time Ledger
CREATE TABLE budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    participant_id UUID REFERENCES users(user_id),
    total_authorized DECIMAL(12,2) DEFAULT 0.00,
    spent_to_date DECIMAL(12,2) DEFAULT 0.00,
    encumbered_funds DECIMAL(12,2) DEFAULT 0.00, -- Real-time shifts not yet processed for payroll
    last_reconciled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, participant_id)
);

-- 5. Compliance & EVV Tracking
CREATE TABLE shifts (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    caregiver_id UUID REFERENCES users(user_id),
    participant_id UUID REFERENCES users(user_id),
    service_code VARCHAR(10) NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_lat DECIMAL(9,6),
    clock_in_lon DECIMAL(9,6),
    clock_out_lat DECIMAL(9,6),
    clock_out_lon DECIMAL(9,6),
    verification_type VARCHAR(20) DEFAULT 'GPS',
    sandata_status VARCHAR(20) CHECK (sandata_status IN ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
    is_manual_entry BOOLEAN DEFAULT FALSE,
    estimated_cost DECIMAL(10,2)
);

CREATE TABLE worker_compliance (
    worker_id UUID PRIMARY KEY REFERENCES users(user_id),
    tenant_id UUID REFERENCES tenants(tenant_id),
    relationship_code VARCHAR(20), -- SPOUSE, PARENT, CHILD_U21, etc.
    is_live_in BOOLEAN DEFAULT FALSE,
    is_evv_exempt BOOLEAN DEFAULT FALSE,
    fica_exempt BOOLEAN DEFAULT FALSE,
    suta_exempt BOOLEAN DEFAULT FALSE,
    last_background_check DATE,
    background_check_expiry DATE,
    bid_status VARCHAR(20) DEFAULT 'PENDING'
);

-- 6. HIPAA Immutable Audit Log
CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(tenant_id),
    user_id UUID REFERENCES users(user_id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance and multi-tenancy
CREATE INDEX idx_tenant_id ON users(tenant_id);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_budget_participant ON budgets(participant_id);
CREATE INDEX idx_shift_status ON shifts(sandata_status);
CREATE INDEX idx_enrollments_tenant ON enrollments(tenant_id);
CREATE INDEX idx_shifts_tenant ON shifts(tenant_id);

-- 7. Real-time Compliance Logic (Phase 3.1)
CREATE OR REPLACE FUNCTION verify_shift_compliance(
    p_participant_id UUID,
    p_service_code VARCHAR(10),
    p_estimated_cost DECIMAL(10,2)
) RETURNS JSONB AS $$
DECLARE
    v_remaining_budget DECIMAL(12,2);
    v_is_enrolled BOOLEAN;
BEGIN
    -- 1. Check Medicaid Enrollment
    SELECT (status = 'ACTIVE') INTO v_is_enrolled FROM enrollments WHERE participant_id = p_participant_id;
    IF NOT v_is_enrolled THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Participant enrollment is not ACTIVE.');
    END IF;

    -- 2. Calculate Effective Budget
    SELECT (total_authorized - (spent_to_date + encumbered_funds)) INTO v_remaining_budget
    FROM budgets WHERE participant_id = p_participant_id;

    -- 3. Hard-Block Logic
    IF v_remaining_budget < p_estimated_cost THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Insufficient funds. Budget overrun blocked.', 'balance', v_remaining_budget);
    END IF;

    RETURN jsonb_build_object('allowed', true, 'remaining_balance', v_remaining_budget - p_estimated_cost);
END;
$$ LANGUAGE plpgsql;
