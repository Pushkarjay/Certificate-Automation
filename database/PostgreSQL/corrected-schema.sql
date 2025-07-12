-- CORRECTED PostgreSQL Database Schema for Certificate Automation System
-- This schema matches the actual API requirements

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_name VARCHAR(255) NOT NULL UNIQUE,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    duration_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name VARCHAR(255) NOT NULL,
    batch_initials VARCHAR(10) NOT NULL,
    course_id UUID REFERENCES courses(course_id),
    start_date DATE,
    end_date DATE,
    trainer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_path VARCHAR(500) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'student', 'trainer', 'trainee'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student certificates table (matches API expectations)
CREATE TABLE IF NOT EXISTS student_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_ref_no VARCHAR(100) UNIQUE,
    title VARCHAR(10), -- Mr, Ms, Dr, Prof
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(course_id),
    batch_id UUID REFERENCES batches(batch_id),
    template_id UUID REFERENCES certificate_templates(template_id),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, generated, issued, revoked
    certificate_file_path VARCHAR(500),
    verification_url VARCHAR(500),
    qr_code_data TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trainer certificates table
CREATE TABLE IF NOT EXISTS trainer_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_ref_no VARCHAR(100) UNIQUE,
    title VARCHAR(10),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    course_id UUID REFERENCES courses(course_id),
    batch_id UUID REFERENCES batches(batch_id),
    template_id UUID REFERENCES certificate_templates(template_id),
    training_hours INTEGER,
    training_start_date DATE,
    training_end_date DATE,
    performance_rating DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending',
    certificate_file_path VARCHAR(500),
    verification_url VARCHAR(500),
    qr_code_data TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trainee certificates table
CREATE TABLE IF NOT EXISTS trainee_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_ref_no VARCHAR(100) UNIQUE,
    title VARCHAR(10),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    position VARCHAR(255),
    course_id UUID REFERENCES courses(course_id),
    batch_id UUID REFERENCES batches(batch_id),
    template_id UUID REFERENCES certificate_templates(template_id),
    training_type VARCHAR(50), -- workshop, bootcamp, certification, seminar
    training_start_date DATE,
    training_end_date DATE,
    training_duration_hours INTEGER,
    attendance_percentage DECIMAL(5,2),
    assessment_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    certificate_file_path VARCHAR(500),
    verification_url VARCHAR(500),
    qr_code_data TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions table (for Google Forms integration)
CREATE TABLE IF NOT EXISTS form_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type VARCHAR(50) NOT NULL, -- 'student', 'trainer', 'trainee'
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    certificate_id UUID,
    error_message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Insert some default courses
INSERT INTO courses (course_name, course_code, description) VALUES
('Cloud Computing', 'CC', 'Introduction to Cloud Computing Technologies'),
('Data Structures & Algorithms', 'DSA', 'Core Computer Science Concepts'),
('VLSI Design', 'VLSI', 'Very Large Scale Integration Design'),
('Java Programming', 'JAVA', 'Object-Oriented Programming with Java'),
('SQL Database Management', 'SQL', 'Structured Query Language and Database Design'),
('Python Programming', 'PYTHON', 'Programming with Python'),
('Robotics', 'ROBOTICS', 'Introduction to Robotics and Automation'),
('Advanced Android Development', 'AAD', 'Mobile App Development'),
('Software Testing & Tools', 'ST&T', 'Quality Assurance and Testing'),
('AutoCAD', 'AUTOCAD', 'Computer-Aided Design'),
('SAP FICO', 'SAP-FICO', 'SAP Financial and Controlling'),
('Cyber Security', 'CS', 'Information Security and Cyber Defense'),
('Embedded Systems', 'ES', 'Microcontroller and IoT Development'),
('Data Science', 'DS', 'Data Analysis and Machine Learning')
ON CONFLICT (course_code) DO NOTHING;

-- Insert some default batches
INSERT INTO batches (batch_name, batch_initials, course_id, start_date, end_date) 
SELECT 
    'G1 ' || c.course_name, 
    'G1', 
    c.course_id, 
    '2024-01-01'::date, 
    '2024-03-31'::date
FROM courses c
WHERE c.course_code IN ('CC', 'DSA', 'VLSI', 'JAVA')
ON CONFLICT DO NOTHING;

-- Insert some default templates
INSERT INTO certificate_templates (template_name, template_path, template_type) VALUES
('G1 Cloud Computing', 'G1 CC.jpg', 'student'),
('G2 Data Structures', 'G2 DSA.jpg', 'student'),
('G10 VLSI Design', 'G10 VLSI.jpg', 'student'),
('G12 Java Programming', 'G12 Java.jpg', 'student'),
('G12 SQL Database', 'G12 SQL.jpg', 'student'),
('G28 Python Programming', 'G28 Python.jpg', 'student')
ON CONFLICT (template_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_certificates_status ON student_certificates(status);
CREATE INDEX IF NOT EXISTS idx_student_certificates_email ON student_certificates(email);
CREATE INDEX IF NOT EXISTS idx_student_certificates_ref_no ON student_certificates(certificate_ref_no);
CREATE INDEX IF NOT EXISTS idx_trainer_certificates_status ON trainer_certificates(status);
CREATE INDEX IF NOT EXISTS idx_trainee_certificates_status ON trainee_certificates(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_processed ON form_submissions(processed);
