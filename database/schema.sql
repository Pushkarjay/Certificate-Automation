-- CertifyPro - Digital Certificate Platform
-- Enhanced MySQL Database Schema with Authentication
-- Created: 2025-07-06

-- Create database
CREATE DATABASE IF NOT EXISTS certifypro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE certifypro_db;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL, -- NULL for OAuth users
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    secondary_email VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
    date_of_birth DATE NULL,
    profile_picture VARCHAR(500) NULL,
    bio TEXT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    
    -- OAuth fields
    google_id VARCHAR(255) NULL UNIQUE,
    oauth_provider ENUM('local', 'google') DEFAULT 'local',
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    
    -- Profile completion
    profile_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_google_id (google_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Create organizations table (for future use)
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(500),
    logo_url VARCHAR(500),
    admin_user_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
);

-- Enhanced certificates table
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    dof_no VARCHAR(100) NOT NULL UNIQUE,
    
    -- Recipient information
    recipient_user_id INT NULL, -- Links to users table when user claims certificate
    recipient_email VARCHAR(255) NOT NULL, -- Always store email even if no account
    recipient_name VARCHAR(200) NOT NULL,
    
    -- Certificate details
    title VARCHAR(200) NOT NULL, -- Certificate title
    program VARCHAR(200) NOT NULL,
    description TEXT NULL,
    certificate_type ENUM('student', 'trainer', 'completion', 'achievement', 'participation') NOT NULL DEFAULT 'student',
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    
    -- Issuer information
    issued_by_user_id INT NOT NULL, -- Admin who issued
    issued_by_org_id INT NULL, -- Organization (optional)
    
    -- Student-specific fields
    training_duration VARCHAR(50) NULL,
    subject_course VARCHAR(200) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    gpa DECIMAL(3,2) NULL,
    grade VARCHAR(10) NULL,
    
    -- Trainer-specific fields
    specialization VARCHAR(200) NULL,
    experience_years INT NULL,
    
    -- Certificate design and content
    template_id INT NULL,
    custom_fields JSON NULL, -- Store additional custom data
    
    -- QR Code and verification
    qr_code_data TEXT NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    
    -- Sharing and privacy
    is_public BOOLEAN DEFAULT TRUE, -- Can be viewed publicly
    is_shareable BOOLEAN DEFAULT TRUE, -- Can be shared by recipient
    share_token VARCHAR(100) NULL UNIQUE, -- For public sharing
    
    -- Status and metadata
    status ENUM('draft', 'issued', 'revoked', 'expired') DEFAULT 'issued',
    verification_count INT DEFAULT 0,
    last_verified DATETIME NULL,
    
    -- Skills and tags
    skills JSON NULL, -- Array of skills
    tags JSON NULL, -- Array of tags
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (issued_by_user_id) REFERENCES users(id),
    FOREIGN KEY (issued_by_org_id) REFERENCES organizations(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_dof_no (dof_no),
    INDEX idx_ref_no (ref_no),
    INDEX idx_recipient_user_id (recipient_user_id),
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_issued_by_user_id (issued_by_user_id),
    INDEX idx_issue_date (issue_date),
    INDEX idx_certificate_type (certificate_type),
    INDEX idx_status (status),
    INDEX idx_is_public (is_public),
    INDEX idx_share_token (share_token)
);

-- Enhanced verification_logs table
CREATE TABLE verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    dof_no VARCHAR(100) NOT NULL,
    
    -- Verifier information
    verifier_user_id INT NULL, -- If logged in user
    verifier_ip VARCHAR(45),
    verifier_user_agent TEXT,
    verifier_location VARCHAR(100) NULL, -- Detected location
    
    -- Verification details
    verification_method ENUM('qr_scan', 'manual_entry', 'api_call') NOT NULL,
    verification_status ENUM('success', 'failed', 'not_found', 'expired', 'revoked') NOT NULL,
    verification_source VARCHAR(100) NULL, -- web, mobile, api, etc.
    
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
    FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_certificate_id (certificate_id),
    INDEX idx_dof_no (dof_no),
    INDEX idx_verifier_user_id (verifier_user_id),
    INDEX idx_verified_at (verified_at),
    INDEX idx_verification_status (verification_status)
);

-- Certificate templates table
CREATE TABLE certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type ENUM('student', 'trainer', 'completion', 'achievement', 'participation') NOT NULL,
    
    -- Template design
    template_data JSON NOT NULL, -- Design configuration
    preview_image VARCHAR(500) NULL,
    
    -- Template metadata
    created_by_user_id INT NOT NULL,
    organization_id INT NULL,
    is_public BOOLEAN DEFAULT FALSE, -- Available to all organizations
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_type (type),
    INDEX idx_is_public (is_public),
    INDEX idx_is_active (is_active)
);

-- User sessions table for JWT token management
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_id VARCHAR(255) NOT NULL UNIQUE, -- JWT ID
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_id (token_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL, -- The email being verified
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
);

-- User activities log
CREATE TABLE user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('login', 'logout', 'certificate_issued', 'certificate_claimed', 'certificate_shared', 'profile_updated') NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user
INSERT INTO users (
    email, password_hash, first_name, last_name, role, is_verified, is_active, profile_completed
) VALUES (
    'admin@certifypro.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1xUVOrcH6W', -- password: admin123
    'System',
    'Administrator',
    'admin',
    TRUE,
    TRUE,
    TRUE
);

-- Insert default organization
INSERT INTO organizations (
    name, slug, description, admin_user_id
) VALUES (
    'CertifyPro',
    'certifypro',
    'Default organization for CertifyPro platform',
    1
);

-- Insert default certificate templates
INSERT INTO certificate_templates (name, slug, type, template_data, created_by_user_id, is_public) VALUES 
('Modern Student Certificate', 'modern-student', 'student', JSON_OBJECT(
    'layout', JSON_OBJECT(
        'size', 'A4',
        'orientation', 'landscape',
        'margin', '2cm'
    ),
    'header', JSON_OBJECT(
        'leftLogo', 'suretrust-logo.png',
        'rightLogo', 'actie-logo.png',
        'title', 'Certificate of Achievement',
        'subtitle', 'This is to certify that'
    ),
    'body', JSON_OBJECT(
        'recipientNameStyle', JSON_OBJECT('fontSize', '36px', 'fontWeight', 'bold', 'color', '#2563eb'),
        'completionText', 'has successfully completed {duration} training in "{program}" subject course from "{course}" from {startDate} to {endDate} securing GPA "{gpa}" attending mandatory "Life Skills Training Sessions" by SureTrust.',
        'skillsSection', true,
        'gradesSection', true
    ),
    'footer', JSON_OBJECT(
        'qrPosition', 'bottom-left',
        'signaturePosition', 'bottom-center',
        'datePosition', 'bottom-right',
        'refNoPosition', 'bottom-right'
    ),
    'styling', JSON_OBJECT(
        'primaryColor', '#2563eb',
        'secondaryColor', '#64748b',
        'fontFamily', 'Inter',
        'borderStyle', 'modern'
    )
), 1, TRUE),
('Professional Trainer Certificate', 'professional-trainer', 'trainer', JSON_OBJECT(
    'layout', JSON_OBJECT(
        'size', 'A4',
        'orientation', 'landscape',
        'margin', '2cm'
    ),
    'header', JSON_OBJECT(
        'leftLogo', 'suretrust-logo.png',
        'rightLogo', 'actie-logo.png',
        'title', 'Professional Trainer Certification',
        'subtitle', 'This certificate is issued to'
    ),
    'body', JSON_OBJECT(
        'recipientNameStyle', JSON_OBJECT('fontSize', '36px', 'fontWeight', 'bold', 'color', '#059669'),
        'completionText', 'in recognition of expertise in "{specialization}" with {experience} years of professional training experience and dedication to excellence in education.',
        'expertiseSection', true,
        'credentialsSection', true
    ),
    'footer', JSON_OBJECT(
        'qrPosition', 'bottom-left',
        'signaturePosition', 'bottom-center',
        'datePosition', 'bottom-right'
    ),
    'styling', JSON_OBJECT(
        'primaryColor', '#059669',
        'secondaryColor', '#64748b',
        'fontFamily', 'Inter',
        'borderStyle', 'professional'
    )
), 1, TRUE);

-- Create stored procedures for common operations

-- Procedure to generate unique DOF number
DELIMITER //
CREATE PROCEDURE GenerateUniqueDofNo(OUT new_dof_no VARCHAR(100))
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE temp_dof VARCHAR(100);
    
    REPEAT
        SET temp_dof = CONCAT('DOF-', UNIX_TIMESTAMP(), '-', 
                            UPPER(SUBSTRING(MD5(RAND()), 1, 8)));
        
        SELECT COUNT(*) = 0 INTO done FROM certificates WHERE dof_no = temp_dof;
    UNTIL done END REPEAT;
    
    SET new_dof_no = temp_dof;
END //
DELIMITER ;

-- Procedure to verify certificate and log attempt
DELIMITER //
CREATE PROCEDURE VerifyCertificate(
    IN p_dof_no VARCHAR(100),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    OUT p_result JSON
)
BEGIN
    DECLARE cert_count INT DEFAULT 0;
    DECLARE cert_id INT;
    DECLARE verification_status VARCHAR(20);
    
    -- Check if certificate exists and is active
    SELECT COUNT(*), id INTO cert_count, cert_id 
    FROM certificates 
    WHERE dof_no = p_dof_no AND is_active = TRUE;
    
    IF cert_count > 0 THEN
        -- Certificate found - update verification count
        UPDATE certificates 
        SET verification_count = verification_count + 1,
            last_verified = CURRENT_TIMESTAMP
        WHERE id = cert_id;
        
        SET verification_status = 'success';
        
        -- Get certificate data
        SELECT JSON_OBJECT(
            'success', TRUE,
            'verified', TRUE,
            'message', 'Certificate verified successfully',
            'data', JSON_OBJECT(
                'id', id,
                'refNo', ref_no,
                'dofNo', dof_no,
                'name', name,
                'program', program,
                'certificateType', certificate_type,
                'issueDate', issue_date,
                'trainingDuration', training_duration,
                'subjectCourse', subject_course,
                'startDate', start_date,
                'endDate', end_date,
                'gpa', gpa,
                'verificationCount', verification_count,
                'lastVerified', last_verified
            )
        ) INTO p_result
        FROM certificates WHERE id = cert_id;
    ELSE
        SET verification_status = 'not_found';
        SET p_result = JSON_OBJECT(
            'success', FALSE,
            'verified', FALSE,
            'message', 'Certificate not found or inactive'
        );
    END IF;
    
    -- Log verification attempt
    INSERT INTO verification_logs (certificate_id, dof_no, ip_address, user_agent, verification_status)
    VALUES (cert_id, p_dof_no, p_ip_address, p_user_agent, verification_status);
    
END //
DELIMITER ;

-- Create views for easier querying

-- View for active certificates with computed fields
CREATE VIEW active_certificates AS
SELECT 
    c.*,
    CASE 
        WHEN c.certificate_type = 'student' THEN 
            CONCAT(c.name, ' - ', c.program, ' (', c.training_duration, ')')
        ELSE 
            CONCAT(c.name, ' - Trainer (', c.specialization, ')')
    END AS display_name,
    DATEDIFF(CURRENT_DATE, c.issue_date) AS days_since_issued
FROM certificates c
WHERE c.is_active = TRUE;

-- View for verification statistics
CREATE VIEW verification_stats AS
SELECT 
    c.id,
    c.dof_no,
    c.name,
    c.verification_count,
    c.last_verified,
    COUNT(vl.id) as total_attempts,
    SUM(CASE WHEN vl.verification_status = 'success' THEN 1 ELSE 0 END) as successful_attempts,
    SUM(CASE WHEN vl.verification_status = 'failed' THEN 1 ELSE 0 END) as failed_attempts
FROM certificates c
LEFT JOIN verification_logs vl ON c.id = vl.certificate_id
GROUP BY c.id, c.dof_no, c.name, c.verification_count, c.last_verified;

-- Create triggers for audit logging

-- Trigger to log certificate updates
CREATE TABLE certificate_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //
CREATE TRIGGER certificate_audit_insert
    AFTER INSERT ON certificates
    FOR EACH ROW
BEGIN
    INSERT INTO certificate_audit (certificate_id, action, new_values, changed_by)
    VALUES (NEW.id, 'INSERT', 
            JSON_OBJECT(
                'ref_no', NEW.ref_no,
                'dof_no', NEW.dof_no,
                'name', NEW.name,
                'program', NEW.program,
                'certificate_type', NEW.certificate_type,
                'is_active', NEW.is_active
            ), 
            NEW.generated_by);
END //

CREATE TRIGGER certificate_audit_update
    AFTER UPDATE ON certificates
    FOR EACH ROW
BEGIN
    INSERT INTO certificate_audit (certificate_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'UPDATE',
            JSON_OBJECT(
                'ref_no', OLD.ref_no,
                'name', OLD.name,
                'is_active', OLD.is_active,
                'verification_count', OLD.verification_count
            ),
            JSON_OBJECT(
                'ref_no', NEW.ref_no,
                'name', NEW.name,
                'is_active', NEW.is_active,
                'verification_count', NEW.verification_count
            ),
            NEW.generated_by);
END //
DELIMITER ;

-- Sample data for testing
INSERT INTO certificates (
    ref_no, dof_no, name, program, certificate_type, issue_date,
    training_duration, subject_course, start_date, end_date, gpa,
    qr_code_data, verification_url
) VALUES 
(
    'REF-2025-001', 
    'DOF-1720258800000-TEST0001', 
    'John Doe', 
    'Full Stack Web Development', 
    'student', 
    '2025-07-06',
    '6 months',
    'MERN Stack Development',
    '2025-01-06',
    '2025-07-06',
    3.85,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAA...',
    'http://localhost:3000/verify/DOF-1720258800000-TEST0001'
),
(
    'REF-2025-002', 
    'DOF-1720258800000-TEST0002', 
    'Jane Smith', 
    'Data Science and Analytics', 
    'student', 
    '2025-07-05',
    '4 months',
    'Python for Data Science',
    '2025-03-05',
    '2025-07-05',
    3.92,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAA...',
    'http://localhost:3000/verify/DOF-1720258800000-TEST0002'
);

-- Performance optimization indexes
CREATE INDEX idx_certificates_composite ON certificates(certificate_type, is_active, issue_date);
CREATE INDEX idx_verification_logs_composite ON verification_logs(verification_status, verified_at);

-- Grant privileges (adjust as needed for your setup)
-- CREATE USER 'cert_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON certificate_db.* TO 'cert_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Show table structure
DESCRIBE certificates;
DESCRIBE verification_logs;
DESCRIBE certificate_templates;

-- Success message
SELECT 'Certificate database schema created successfully!' as message;
