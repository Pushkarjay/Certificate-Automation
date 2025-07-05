-- Certificate Generation & Verification System
-- MySQL Database Schema
-- Created: 2025-07-06

-- Create database
CREATE DATABASE IF NOT EXISTS certificate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE certificate_db;

-- Create certificates table
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    dof_no VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    program VARCHAR(200) NOT NULL,
    certificate_type ENUM('student', 'trainer') NOT NULL DEFAULT 'student',
    issue_date DATE NOT NULL,
    
    -- Student-specific fields
    training_duration VARCHAR(50) NULL,
    subject_course VARCHAR(200) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    gpa DECIMAL(3,2) NULL,
    
    -- Trainer-specific fields (for future implementation)
    specialization VARCHAR(200) NULL,
    experience_years INT NULL,
    
    -- QR Code and verification
    qr_code_data TEXT NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    generated_by VARCHAR(100) DEFAULT 'system',
    verification_count INT DEFAULT 0,
    last_verified DATETIME NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_dof_no (dof_no),
    INDEX idx_ref_no (ref_no),
    INDEX idx_name (name),
    INDEX idx_issue_date (issue_date),
    INDEX idx_certificate_type (certificate_type),
    INDEX idx_is_active (is_active)
);

-- Create verification_logs table to track verification attempts
CREATE TABLE verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    dof_no VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    verification_status ENUM('success', 'failed', 'not_found') NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
    INDEX idx_certificate_id (certificate_id),
    INDEX idx_dof_no (dof_no),
    INDEX idx_verified_at (verified_at)
);

-- Create certificate_templates table for future template management
CREATE TABLE certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('student', 'trainer') NOT NULL,
    template_data JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT INTO certificate_templates (name, type, template_data) VALUES 
('Student Certificate Template', 'student', JSON_OBJECT(
    'header', JSON_OBJECT(
        'leftLogo', 'suretrust-logo.png',
        'rightLogo', 'actie-logo.png',
        'title', 'SureTrust Certificate',
        'description', 'Professional Training Certification'
    ),
    'body', JSON_OBJECT(
        'certificationText', 'This certificate is issued to',
        'completionText', 'for successful completion of {duration} training in "{program}" subject course from "{course}" start date to end date securing GPA "{gpa}" attending mandatory "Life Skills Training Sessions" by SureTrust.'
    ),
    'footer', JSON_OBJECT(
        'qrPosition', 'bottom-left',
        'signaturePosition', 'bottom-center',
        'datePosition', 'bottom-right'
    )
)),
('Trainer Certificate Template', 'trainer', JSON_OBJECT(
    'header', JSON_OBJECT(
        'leftLogo', 'suretrust-logo.png',
        'rightLogo', 'actie-logo.png',
        'title', 'SureTrust Trainer Certification',
        'description', 'Professional Trainer Certification'
    ),
    'body', JSON_OBJECT(
        'certificationText', 'This certificate is issued to',
        'completionText', 'in recognition of expertise in "{specialization}" with {experience} years of training experience.'
    ),
    'footer', JSON_OBJECT(
        'qrPosition', 'bottom-left',
        'signaturePosition', 'bottom-center',
        'datePosition', 'bottom-right'
    )
));

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
