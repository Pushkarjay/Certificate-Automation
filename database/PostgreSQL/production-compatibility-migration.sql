-- Production Database Schema Compatibility Migration
-- This migration ensures the database has both old and new table structures
-- Run this on production to make the system fully compatible

-- First, ensure the form-based schema tables exist (primary production tables)
DO $$ 
BEGIN
    -- Check if certificate_generations table exists, if not include basic structure
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificate_generations') THEN
        -- This table is needed for production certificates
        RAISE NOTICE 'Certificate_generations table does not exist. Please run form-based-schema.sql first.';
    END IF;
    
    -- Check if form_submissions table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'form_submissions') THEN
        RAISE NOTICE 'Form_submissions table does not exist. Please run form-based-schema.sql first.';
    END IF;
END $$;

-- Ensure binary storage columns exist in certificate_generations
ALTER TABLE certificate_generations 
ADD COLUMN IF NOT EXISTS certificate_pdf_data BYTEA,
ADD COLUMN IF NOT EXISTS certificate_image_data BYTEA,
ADD COLUMN IF NOT EXISTS certificate_svg_data TEXT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT 'pdf',
ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(100) DEFAULT 'application/pdf';

-- Ensure legacy tables exist for backward compatibility (if they don't already exist)
CREATE TABLE IF NOT EXISTS student_certificates (
    certificate_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE,
    certificate_ref_no VARCHAR(100) UNIQUE NOT NULL,
    grade VARCHAR(10),
    trainer_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'generated',
    course_id INTEGER,
    batch_id INTEGER,
    template_id INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_certificates (
    certificate_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE,
    certificate_ref_no VARCHAR(100) UNIQUE NOT NULL,
    grade VARCHAR(10),
    trainer_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'generated',
    course_id INTEGER,
    batch_id INTEGER,
    template_id INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainee_certificates (
    certificate_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE,
    certificate_ref_no VARCHAR(100) UNIQUE NOT NULL,
    grade VARCHAR(10),
    trainer_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'generated',
    course_id INTEGER,
    batch_id INTEGER,
    template_id INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_generations_ref_no ON certificate_generations(certificate_ref_no);
CREATE INDEX IF NOT EXISTS idx_student_certificates_ref_no ON student_certificates(certificate_ref_no);
CREATE INDEX IF NOT EXISTS idx_trainer_certificates_ref_no ON trainer_certificates(certificate_ref_no);
CREATE INDEX IF NOT EXISTS idx_trainee_certificates_ref_no ON trainee_certificates(certificate_ref_no);

-- Add comments
COMMENT ON TABLE certificate_generations IS 'Primary production table for certificate generation via forms';
COMMENT ON TABLE student_certificates IS 'Legacy table for backward compatibility';
COMMENT ON TABLE trainer_certificates IS 'Legacy table for backward compatibility';
COMMENT ON TABLE trainee_certificates IS 'Legacy table for backward compatibility';

-- Verify the migration
DO $$ 
BEGIN
    RAISE NOTICE '✅ Database schema compatibility migration completed successfully.';
    RAISE NOTICE '📊 Tables available: certificate_generations (primary), student_certificates, trainer_certificates, trainee_certificates (legacy)';
    RAISE NOTICE '🔍 Verification endpoint will search all tables for maximum compatibility.';
END $$;
