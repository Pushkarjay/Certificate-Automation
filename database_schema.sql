-- Certificate Automation Database Schema
-- Created: July 10, 2025

-- Create database
CREATE DATABASE certificate_automation;
USE certificate_automation;

-- =============================================
-- REFERENCE TABLES
-- =============================================

-- Table for certificate templates
CREATE TABLE certificate_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL,
    template_file_path VARCHAR(255) NOT NULL,
    course_domain VARCHAR(100) NOT NULL,
    graduation_batch VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for courses/domains
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(150) NOT NULL,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    duration_months INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for batches
CREATE TABLE batches (
    batch_id INT PRIMARY KEY AUTO_INCREMENT,
    batch_name VARCHAR(100) NOT NULL,
    batch_initials VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    course_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- =============================================
-- STUDENT CERTIFICATES TABLE
-- =============================================

CREATE TABLE student_certificates (
    certificate_id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Student Information
    title VARCHAR(10) NOT NULL, -- Ms, Mr, Dr, etc.
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    
    -- Course Information
    course_id INT NOT NULL,
    batch_id INT NOT NULL,
    duration_months INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    gpa DECIMAL(3,2) NOT NULL,
    
    -- Template Information
    template_id INT NOT NULL,
    
    -- NEW COLUMNS - Certificate Verification
    certificate_ref_no VARCHAR(50) UNIQUE NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    qr_code_data TEXT NOT NULL, -- Base64 encoded QR code image
    
    -- Certificate Generation Info
    certificate_file_path VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'generated', 'issued', 'revoked') DEFAULT 'pending',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(template_id),
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_ref_no (certificate_ref_no),
    INDEX idx_batch_course (batch_id, course_id),
    INDEX idx_status (status)
);

-- =============================================
-- TRAINER CERTIFICATES TABLE
-- =============================================

CREATE TABLE trainer_certificates (
    certificate_id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Trainer Information
    title VARCHAR(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50),
    qualification VARCHAR(200),
    specialization VARCHAR(150),
    
    -- Training Information
    course_id INT NOT NULL,
    batch_id INT NOT NULL,
    training_hours INT NOT NULL,
    training_start_date DATE NOT NULL,
    training_end_date DATE NOT NULL,
    performance_rating DECIMAL(3,2),
    
    -- Template Information
    template_id INT NOT NULL,
    
    -- NEW COLUMNS - Certificate Verification
    certificate_ref_no VARCHAR(50) UNIQUE NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    qr_code_data TEXT NOT NULL,
    
    -- Certificate Generation Info
    certificate_file_path VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'generated', 'issued', 'revoked') DEFAULT 'pending',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(template_id),
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_employee_id (employee_id),
    INDEX idx_ref_no (certificate_ref_no),
    INDEX idx_batch_course (batch_id, course_id),
    INDEX idx_status (status)
);

-- =============================================
-- TRAINEE CERTIFICATES TABLE
-- =============================================

CREATE TABLE trainee_certificates (
    certificate_id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Trainee Information
    title VARCHAR(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(150),
    position VARCHAR(100),
    
    -- Training Information
    course_id INT NOT NULL,
    batch_id INT NOT NULL,
    training_duration_hours INT NOT NULL,
    training_start_date DATE NOT NULL,
    training_end_date DATE NOT NULL,
    attendance_percentage DECIMAL(5,2),
    assessment_score DECIMAL(5,2),
    
    -- Template Information
    template_id INT NOT NULL,
    
    -- NEW COLUMNS - Certificate Verification
    certificate_ref_no VARCHAR(50) UNIQUE NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    qr_code_data TEXT NOT NULL,
    
    -- Certificate Generation Info
    certificate_file_path VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'generated', 'issued', 'revoked') DEFAULT 'pending',
    
    -- Additional Training Info
    training_type ENUM('workshop', 'bootcamp', 'certification', 'seminar') DEFAULT 'workshop',
    completion_requirements TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(template_id),
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_organization (organization),
    INDEX idx_ref_no (certificate_ref_no),
    INDEX idx_batch_course (batch_id, course_id),
    INDEX idx_status (status)
);

-- =============================================
-- SAMPLE DATA INSERTS
-- =============================================

-- Insert sample courses
INSERT INTO courses (course_name, course_code, duration_months, description) VALUES
('Python & Machine Learning Basic Applications', 'PY_ML_BASIC', 4, 'Comprehensive Python programming with machine learning fundamentals'),
('VLSI Design', 'VLSI_DESIGN', 4, 'Very Large Scale Integration circuit design and verification'),
('Java Programming', 'JAVA_PROG', 4, 'Object-oriented programming with Java'),
('SQL Database Management', 'SQL_DB', 4, 'Database design and SQL query optimization'),
('Data Structures & Algorithms', 'DSA', 4, 'Core computer science fundamentals'),
('Robotics', 'ROBOTICS', 4, 'Introduction to robotics and automation'),
('AutoCAD Design', 'AUTOCAD', 4, 'Computer-aided design and drafting'),
('SAP FICO', 'SAP_FICO', 4, 'SAP Financial Accounting and Controlling'),
('Cyber Security', 'CYBER_SEC', 4, 'Information security and ethical hacking'),
('Embedded Systems', 'EMBEDDED', 4, 'Microcontroller programming and hardware design'),
('Data Science', 'DATA_SCI', 4, 'Statistics, analytics, and data visualization');

-- Insert sample templates
INSERT INTO certificate_templates (template_name, template_file_path, course_domain, graduation_batch) VALUES
('G1 CC Template', 'Templates/G1 CC.jpg', 'Cyber Security', 'G1'),
('G2 DSA Template', 'Templates/G2 DSA.jpg', 'Data Structures & Algorithms', 'G2'),
('G2 Robotics Template', 'Templates/G2 ROBOTICS.jpg', 'Robotics', 'G2'),
('G3 AAD Template', 'Templates/G3 AAD.jpg', 'Android App Development', 'G3'),
('G4 ST&T Template', 'Templates/G4 ST&T.jpg', 'Software Testing & Tools', 'G4'),
('G5 AutoCAD Template', 'Templates/G5 Autocad.jpg', 'AutoCAD Design', 'G5'),
('G5 SAP FICO Template', 'Templates/G5 SAP FICO.jpg', 'SAP FICO', 'G5'),
('G6 AutoCAD Template', 'Templates/G6 AUTOCAD.jpg', 'AutoCAD Design', 'G6'),
('G6 CS Template', 'Templates/G6 CS.jpg', 'Cyber Security', 'G6'),
('G7 AutoCAD Template', 'Templates/G7 Autocad.jpg', 'AutoCAD Design', 'G7'),
('G7 ES Template', 'Templates/G7 ES.jpg', 'Embedded Systems', 'G7'),
('G8 DS Template', 'Templates/G8 DS.jpg', 'Data Science', 'G8'),
('G10 VLSI Template', 'Templates/G10 VLSI.jpg', 'VLSI Design', 'G10'),
('G12 Java Template', 'Templates/G12 Java.jpg', 'Java Programming', 'G12'),
('G12 SQL Template', 'Templates/G12 SQL.jpg', 'SQL Database Management', 'G12'),
('G13 Java Template', 'Templates/G13 JAVA.jpg', 'Java Programming', 'G13'),
('G13 VLSI Template', 'Templates/G13 VLSI.jpg', 'VLSI Design', 'G13'),
('G14 VLSI Template', 'Templates/G14 VLSI.jpg', 'VLSI Design', 'G14'),
('G15 VLSI Template', 'Templates/G15 VLSI.jpg', 'VLSI Design', 'G15'),
('G16 VLSI Template', 'Templates/G16 VLSI.jpg', 'VLSI Design', 'G16'),
('G28 Python Template', 'Templates/G28 Python.jpg', 'Python & Machine Learning Basic Applications', 'G28');

-- Insert sample batches
INSERT INTO batches (batch_name, batch_initials, start_date, end_date, course_id) VALUES
('G28 Python Batch', 'G28', '2023-09-01', '2024-01-31', 1),
('G15 VLSI Batch', 'G15', '2023-09-01', '2024-01-31', 2),
('G12 Java Batch', 'G12', '2023-06-01', '2023-10-31', 3),
('G13 VLSI Batch', 'G13', '2023-07-01', '2023-11-30', 2);

-- =============================================
-- HELPER FUNCTIONS AND PROCEDURES
-- =============================================

-- Function to generate certificate reference number
DELIMITER //
CREATE FUNCTION generate_cert_ref_no(cert_type VARCHAR(20), batch_initials VARCHAR(20), cert_id INT) 
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE ref_no VARCHAR(50);
    DECLARE year_part VARCHAR(4);
    
    SET year_part = YEAR(CURDATE());
    SET ref_no = CONCAT(
        UPPER(cert_type), '-',
        batch_initials, '-',
        year_part, '-',
        LPAD(cert_id, 6, '0')
    );
    
    RETURN ref_no;
END //
DELIMITER ;

-- Function to generate verification URL
DELIMITER //
CREATE FUNCTION generate_verification_url(ref_no VARCHAR(50)) 
RETURNS VARCHAR(500)
DETERMINISTIC
BEGIN
    DECLARE base_url VARCHAR(200);
    SET base_url = 'https://certificates.suretrust.org/verify/';
    RETURN CONCAT(base_url, ref_no);
END //
DELIMITER ;

-- =============================================
-- TRIGGERS FOR AUTO-GENERATING REFERENCE NUMBERS AND URLS
-- =============================================

-- Trigger for student certificates
DELIMITER //
CREATE TRIGGER student_cert_before_insert
BEFORE INSERT ON student_certificates
FOR EACH ROW
BEGIN
    DECLARE batch_initials VARCHAR(20);
    
    -- Get batch initials
    SELECT b.batch_initials INTO batch_initials
    FROM batches b
    WHERE b.batch_id = NEW.batch_id;
    
    -- Generate reference number and verification URL
    SET NEW.certificate_ref_no = generate_cert_ref_no('STUDENT', batch_initials, NEW.certificate_id);
    SET NEW.verification_url = generate_verification_url(NEW.certificate_ref_no);
END //
DELIMITER ;

-- Trigger for trainer certificates  
DELIMITER //
CREATE TRIGGER trainer_cert_before_insert
BEFORE INSERT ON trainer_certificates
FOR EACH ROW
BEGIN
    DECLARE batch_initials VARCHAR(20);
    
    -- Get batch initials
    SELECT b.batch_initials INTO batch_initials
    FROM batches b
    WHERE b.batch_id = NEW.batch_id;
    
    -- Generate reference number and verification URL
    SET NEW.certificate_ref_no = generate_cert_ref_no('TRAINER', batch_initials, NEW.certificate_id);
    SET NEW.verification_url = generate_verification_url(NEW.certificate_ref_no);
END //
DELIMITER ;

-- Trigger for trainee certificates
DELIMITER //
CREATE TRIGGER trainee_cert_before_insert
BEFORE INSERT ON trainee_certificates
FOR EACH ROW
BEGIN
    DECLARE batch_initials VARCHAR(20);
    
    -- Get batch initials
    SELECT b.batch_initials INTO batch_initials
    FROM batches b
    WHERE b.batch_id = NEW.batch_id;
    
    -- Generate reference number and verification URL
    SET NEW.certificate_ref_no = generate_cert_ref_no('TRAINEE', batch_initials, NEW.certificate_id);
    SET NEW.verification_url = generate_verification_url(NEW.certificate_ref_no);
END //
DELIMITER ;

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- View for student certificate details
CREATE VIEW student_certificate_details AS
SELECT 
    sc.certificate_id,
    sc.certificate_ref_no,
    CONCAT(sc.title, ' ', sc.full_name) AS full_name,
    sc.email,
    c.course_name,
    c.course_code,
    b.batch_name,
    b.batch_initials,
    sc.start_date,
    sc.end_date,
    sc.gpa,
    ct.template_name,
    sc.verification_url,
    sc.status,
    sc.generated_at
FROM student_certificates sc
JOIN courses c ON sc.course_id = c.course_id
JOIN batches b ON sc.batch_id = b.batch_id
JOIN certificate_templates ct ON sc.template_id = ct.template_id;

-- View for trainer certificate details
CREATE VIEW trainer_certificate_details AS
SELECT 
    tc.certificate_id,
    tc.certificate_ref_no,
    CONCAT(tc.title, ' ', tc.full_name) AS full_name,
    tc.email,
    tc.employee_id,
    tc.qualification,
    tc.specialization,
    c.course_name,
    c.course_code,
    b.batch_name,
    b.batch_initials,
    tc.training_start_date,
    tc.training_end_date,
    tc.training_hours,
    tc.performance_rating,
    ct.template_name,
    tc.verification_url,
    tc.status,
    tc.generated_at
FROM trainer_certificates tc
JOIN courses c ON tc.course_id = c.course_id
JOIN batches b ON tc.batch_id = b.batch_id
JOIN certificate_templates ct ON tc.template_id = ct.template_id;

-- View for trainee certificate details
CREATE VIEW trainee_certificate_details AS
SELECT 
    tc.certificate_id,
    tc.certificate_ref_no,
    CONCAT(tc.title, ' ', tc.full_name) AS full_name,
    tc.email,
    tc.phone,
    tc.organization,
    tc.position,
    c.course_name,
    c.course_code,
    b.batch_name,
    b.batch_initials,
    tc.training_start_date,
    tc.training_end_date,
    tc.training_duration_hours,
    tc.attendance_percentage,
    tc.assessment_score,
    tc.training_type,
    ct.template_name,
    tc.verification_url,
    tc.status,
    tc.generated_at
FROM trainee_certificates tc
JOIN courses c ON tc.course_id = c.course_id
JOIN batches b ON tc.batch_id = b.batch_id
JOIN certificate_templates ct ON tc.template_id = ct.template_id;

-- =============================================
-- SAMPLE DATA MIGRATION FROM EXISTING CSV
-- =============================================

-- Example insert for student certificate (based on existing data)
INSERT INTO student_certificates (
    title, full_name, email, course_id, batch_id, duration_months, 
    start_date, end_date, gpa, template_id, qr_code_data
) VALUES (
    'Ms', 'P.Harika', 'pharika9390@gmail.com', 1, 1, 4, 
    '2023-09-01', '2024-01-31', 6.7, 21, 'QR_CODE_PLACEHOLDER'
);

-- =============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Additional indexes for better query performance
CREATE INDEX idx_student_cert_date_range ON student_certificates(start_date, end_date);
CREATE INDEX idx_trainer_cert_date_range ON trainer_certificates(training_start_date, training_end_date);
CREATE INDEX idx_trainee_cert_date_range ON trainee_certificates(training_start_date, training_end_date);

-- Composite indexes for common queries
CREATE INDEX idx_student_batch_status ON student_certificates(batch_id, status);
CREATE INDEX idx_trainer_batch_status ON trainer_certificates(batch_id, status);
CREATE INDEX idx_trainee_batch_status ON trainee_certificates(batch_id, status);

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

-- This schema supports:
-- 1. Three types of certificates: Student, Trainer, and Trainee
-- 2. Automatic generation of certificate reference numbers
-- 3. Verification URLs for each certificate
-- 4. QR code storage for verification
-- 5. Template management for different courses and batches
-- 6. Flexible course and batch management
-- 7. Performance-optimized with proper indexing
-- 8. Referential integrity with foreign keys
-- 9. Extensible design for future enhancements
