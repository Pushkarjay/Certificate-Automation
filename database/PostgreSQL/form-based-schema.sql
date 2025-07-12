-- Certificate Automation System - Form-Based Database Schema
-- This schema is designed to match Google Form submissions
-- Updated: July 12, 2025

-- Drop existing tables if they exist
DROP TABLE IF EXISTS certificate_generations CASCADE;
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS certificate_templates CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS batches CASCADE;

-- Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE,
    description TEXT,
    duration_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches table
CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    batch_initials VARCHAR(10),
    course_id INTEGER REFERENCES courses(course_id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificate templates table
CREATE TABLE certificate_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_path VARCHAR(500),
    template_type VARCHAR(50), -- student, trainer, trainee
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main form submissions table (flexible to handle various form fields)
CREATE TABLE form_submissions (
    submission_id SERIAL PRIMARY KEY,
    
    -- Google Form metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_address VARCHAR(255),
    
    -- Personal Information (common in most forms)
    title VARCHAR(10), -- Mr, Ms, Dr, Prof
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    
    -- Address Information
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Educational/Professional Information
    qualification VARCHAR(255),
    institution VARCHAR(255),
    specialization VARCHAR(255),
    experience_years INTEGER,
    organization VARCHAR(255),
    position VARCHAR(255),
    employee_id VARCHAR(50),
    
    -- Course/Training Information
    course_name VARCHAR(255),
    course_domain VARCHAR(255),
    batch_initials VARCHAR(50),
    batch_name VARCHAR(255),
    training_type VARCHAR(100), -- workshop, bootcamp, certification, seminar
    training_mode VARCHAR(50), -- online, offline, hybrid
    
    -- Dates
    start_date DATE,
    end_date DATE,
    training_start_date DATE,
    training_end_date DATE,
    
    -- Performance Metrics
    attendance_percentage DECIMAL(5,2),
    assessment_score DECIMAL(5,2),
    gpa DECIMAL(3,2),
    grade VARCHAR(10),
    performance_rating DECIMAL(3,2),
    training_hours INTEGER,
    training_duration_hours INTEGER,
    
    -- Certificate Type and Status
    certificate_type VARCHAR(50) DEFAULT 'student', -- student, trainer, trainee
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, generated, issued, revoked
    
    -- Revocation Information
    revoked_at TIMESTAMP NULL,
    revocation_reason TEXT NULL,
    revoked_by VARCHAR(255) NULL,
    
    -- Additional flexible fields (JSON for custom form fields)
    additional_data JSONB,
    
    -- Metadata
    form_source VARCHAR(255), -- which form this came from
    raw_form_data JSONB, -- store original form data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificate generations table (links submissions to actual certificates)
CREATE TABLE certificate_generations (
    certificate_id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES form_submissions(submission_id),
    
    -- Certificate Details
    certificate_ref_no VARCHAR(100) UNIQUE NOT NULL,
    verification_url VARCHAR(500),
    qr_code_data TEXT,
    qr_code_path VARCHAR(500),
    
    -- File Paths
    certificate_image_path VARCHAR(500),
    certificate_pdf_path VARCHAR(500),
    
    -- Template and Course Reference
    template_id INTEGER REFERENCES certificate_templates(template_id),
    course_id INTEGER REFERENCES courses(course_id),
    batch_id INTEGER REFERENCES batches(batch_id),
    
    -- Generation Details
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(255), -- admin user who approved
    status VARCHAR(50) DEFAULT 'generated', -- generated, issued, revoked
    
    -- Verification
    is_verified BOOLEAN DEFAULT true,
    verification_count INTEGER DEFAULT 0,
    last_verified TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default courses
INSERT INTO courses (course_name, course_code, description, duration_hours) VALUES
('Java Full Stack Development', 'JAVA_FS', 'Complete Java Full Stack Development Course', 200),
('Python Data Science', 'PY_DS', 'Python for Data Science and Machine Learning', 150),
('Web Development', 'WEB_DEV', 'Frontend and Backend Web Development', 180),
('Digital Marketing', 'DIG_MKT', 'Complete Digital Marketing Course', 100),
('Cloud Computing', 'CLOUD', 'AWS and Cloud Computing Fundamentals', 120),
('AI/ML', 'AIML', 'Artificial Intelligence and Machine Learning', 250),
('Cybersecurity', 'CYBER', 'Information Security and Ethical Hacking', 160),
('Mobile App Development', 'MOBILE', 'Android and iOS App Development', 140);

-- Insert default batches
INSERT INTO batches (batch_name, batch_initials, course_id, start_date, end_date) VALUES
('Batch 2024-01', 'B01', 1, '2024-01-15', '2024-03-15'),
('Batch 2024-02', 'B02', 2, '2024-02-01', '2024-04-01'),
('Batch 2024-03', 'B03', 3, '2024-03-01', '2024-05-01'),
('Batch 2025-01', 'B25-01', 1, '2025-01-15', '2025-03-15'),
('Batch 2025-02', 'B25-02', 2, '2025-02-01', '2025-04-01');

-- Insert default certificate templates
INSERT INTO certificate_templates (template_name, template_path, template_type) VALUES
('Student Certificate Template', 'G1 CC.jpg', 'student'),
('Trainer Certificate Template', 'G2 DSA.jpg', 'trainer'),
('Trainee Certificate Template', 'G3 AAD.jpg', 'trainee'),
('Java Certificate', 'G12 Java.jpg', 'student'),
('Python Certificate', 'G28 Python.jpg', 'student'),
('VLSI Certificate', 'G10 VLSI.jpg', 'student');

-- Create indexes for better performance
CREATE INDEX idx_form_submissions_email ON form_submissions(email_address);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_certificate_type ON form_submissions(certificate_type);
CREATE INDEX idx_form_submissions_timestamp ON form_submissions(timestamp);
CREATE INDEX idx_form_submissions_revoked_at ON form_submissions(revoked_at);
CREATE INDEX idx_certificate_generations_ref_no ON certificate_generations(certificate_ref_no);
CREATE INDEX idx_certificate_generations_status ON certificate_generations(status);
CREATE INDEX idx_certificate_generations_submission_id ON certificate_generations(submission_id);

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificate_generations_updated_at BEFORE UPDATE ON certificate_generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate certificate reference number
CREATE OR REPLACE FUNCTION generate_certificate_ref_no(p_certificate_type VARCHAR, p_course_code VARCHAR, p_batch_initials VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    ref_no VARCHAR;
    counter INTEGER;
BEGIN
    -- Get current year
    SELECT EXTRACT(YEAR FROM CURRENT_DATE) INTO counter;
    
    -- Get count of certificates for this type this year
    SELECT COUNT(*) + 1 INTO counter
    FROM certificate_generations cg
    JOIN form_submissions fs ON cg.submission_id = fs.submission_id
    WHERE fs.certificate_type = p_certificate_type
    AND EXTRACT(YEAR FROM cg.created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Format: TYPE_COURSECODE_BATCH_YEAR_COUNTER
    ref_no := UPPER(p_certificate_type) || '_' || 
              COALESCE(p_course_code, 'GEN') || '_' || 
              COALESCE(p_batch_initials, 'B00') || '_' || 
              EXTRACT(YEAR FROM CURRENT_DATE) || '_' || 
              LPAD(counter::TEXT, 4, '0');
    
    RETURN ref_no;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO form_submissions (
    full_name, email_address, title, phone, course_name, batch_initials, 
    start_date, end_date, certificate_type, gpa, attendance_percentage,
    qualification, organization, status
) VALUES 
('John Doe', 'john.doe@email.com', 'Mr', '+91-9876543210', 'Java Full Stack Development', 'B25-01', 
 '2025-01-15', '2025-03-15', 'student', 8.5, 95.0, 'B.Tech CSE', 'Tech Corp', 'pending'),
('Jane Smith', 'jane.smith@email.com', 'Ms', '+91-9876543211', 'Python Data Science', 'B25-02', 
 '2025-02-01', '2025-04-01', 'student', 9.2, 98.0, 'M.Sc Statistics', 'Data Solutions', 'pending');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
