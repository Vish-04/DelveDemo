CREATE TABLE compliance_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- User identification
    user_email VARCHAR(320) NOT NULL, -- User's email from Supabase auth
    
    -- Check details
    check_type VARCHAR(20) NOT NULL CHECK (check_type IN ('RLS', 'MFA', 'PITR')),
    project_ref VARCHAR(255) NOT NULL,
    
    -- Status and timing
    status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'fail')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Results (flexible JSON storage)
    response_data JSONB NOT NULL, -- Store the complete response
    
    -- Quick summary fields for easy querying
    total_items INTEGER DEFAULT 0,
    compliant_items INTEGER DEFAULT 0,
    compliance_rate INTEGER DEFAULT 0,
    
    -- Error details (when applicable)
    error_message TEXT,
    
    -- Setup info (when setup_required)
    setup_title VARCHAR(500),
    
    -- Additional context
    note TEXT
);