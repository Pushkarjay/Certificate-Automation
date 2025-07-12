-- Add revocation columns to form_submissions table
-- This script adds columns needed for certificate revocation functionality

-- Add revocation timestamp
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP NULL;

-- Add revocation reason
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS revocation_reason TEXT NULL;

-- Add who revoked the certificate
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS revoked_by VARCHAR(255) NULL;

-- Create index for revoked certificates
CREATE INDEX IF NOT EXISTS idx_form_submissions_revoked_at ON form_submissions(revoked_at);

-- Add comment for documentation
COMMENT ON COLUMN form_submissions.revoked_at IS 'Timestamp when the certificate was revoked';
COMMENT ON COLUMN form_submissions.revocation_reason IS 'Reason for certificate revocation';
COMMENT ON COLUMN form_submissions.revoked_by IS 'User/admin who revoked the certificate';

-- Add status column for certificate state
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NULL;

-- Set default status for existing rows
UPDATE form_submissions SET status = 'generated' WHERE status IS NULL;

-- Display schema update completion
SELECT 'Revocation columns added successfully to form_submissions table' AS status;
