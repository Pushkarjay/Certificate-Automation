-- Migration to add binary storage for certificates
-- This allows storing certificate files directly in PostgreSQL

-- Add binary data columns to certificate_generations table
ALTER TABLE certificate_generations 
ADD COLUMN IF NOT EXISTS certificate_pdf_data BYTEA,
ADD COLUMN IF NOT EXISTS certificate_image_data BYTEA,
ADD COLUMN IF NOT EXISTS certificate_svg_data TEXT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT 'pdf',
ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(100) DEFAULT 'application/pdf';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_generations_ref_no ON certificate_generations(certificate_ref_no);

-- Add comments
COMMENT ON COLUMN certificate_generations.certificate_pdf_data IS 'Binary data of the PDF certificate';
COMMENT ON COLUMN certificate_generations.certificate_image_data IS 'Binary data of the certificate image (PNG/JPEG)';
COMMENT ON COLUMN certificate_generations.certificate_svg_data IS 'SVG certificate data as text';
COMMENT ON COLUMN certificate_generations.file_type IS 'Primary file type: pdf, png, svg';
COMMENT ON COLUMN certificate_generations.file_size_bytes IS 'Size of the certificate file in bytes';
COMMENT ON COLUMN certificate_generations.content_type IS 'MIME type for serving the certificate';

-- Update existing records to set default values
UPDATE certificate_generations 
SET 
    file_type = 'pdf',
    content_type = 'application/pdf'
WHERE file_type IS NULL OR content_type IS NULL;
