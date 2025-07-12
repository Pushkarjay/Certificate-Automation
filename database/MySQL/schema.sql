-- MySQL Database Schema for Certificate Automation System
-- This schema is designed based on the SQL queries found in the backend routes

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS certificate_automation;
-- USE certificate_automation;

-- Table for storing student certificate information
CREATE TABLE IF NOT EXISTS student_certificates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    grade VARCHAR(10),
    trainer_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for storing trainer certificate information
CREATE TABLE IF NOT EXISTS trainer_certificates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    trainer_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    completion_date DATE NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    institute_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for storing trainee certificate information
CREATE TABLE IF NOT EXISTS trainee_certificates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    trainee_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    grade VARCHAR(10),
    training_duration VARCHAR(50),
    trainer_name VARCHAR(255),
    template_type VARCHAR(50) NOT NULL,
    certificate_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for form submissions from Google Forms
CREATE TABLE IF NOT EXISTS form_submissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    form_type VARCHAR(50) NOT NULL, -- 'student', 'trainer', 'trainee'
    submission_data JSON NOT NULL,
    processed BOOLEAN DEFAULT false,
    certificate_generated BOOLEAN DEFAULT false,
    certificate_id VARCHAR(36),
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for tracking certificate templates
CREATE TABLE IF NOT EXISTS certificate_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_path VARCHAR(500) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'student', 'trainer', 'trainee'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for system administration logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    action VARCHAR(100) NOT NULL,
    details JSON,
    admin_user VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Indexes for better performance
CREATE INDEX idx_student_certificates_verification_code ON student_certificates(verification_code);
CREATE INDEX idx_trainer_certificates_verification_code ON trainer_certificates(verification_code);
CREATE INDEX idx_trainee_certificates_verification_code ON trainee_certificates(verification_code);
CREATE INDEX idx_student_certificates_certificate_number ON student_certificates(certificate_number);
CREATE INDEX idx_trainer_certificates_certificate_number ON trainer_certificates(certificate_number);
CREATE INDEX idx_trainee_certificates_certificate_number ON trainee_certificates(certificate_number);
CREATE INDEX idx_form_submissions_form_type ON form_submissions(form_type);
CREATE INDEX idx_form_submissions_processed ON form_submissions(processed);

-- Sample data for certificate templates (optional)
INSERT IGNORE INTO certificate_templates (template_name, template_path, template_type) VALUES 
('G1 CC', 'templates/G1 CC.jpg', 'student'),
('G2 DSA', 'templates/G2 DSA.jpg', 'student'),
('G2 ROBOTICS', 'templates/G2 ROBOTICS.jpg', 'student'),
('G3 AAD', 'templates/G3 AAD.jpg', 'student'),
('G10 VLSI', 'templates/G10 VLSI.jpg', 'student'),
('G12 Java', 'templates/G12 Java.jpg', 'student'),
('G12 SQL', 'templates/G12 SQL.jpg', 'student'),
('G28 Python', 'templates/G28 Python.jpg', 'student');
