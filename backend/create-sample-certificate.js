#!/usr/bin/env node

/**
 * Create Sample Certificate with QR Code
 * This script creates a new sample certificate entry in the database
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');

// Database configuration (using production config)
const poolConfig = {
  host: 'dpg-d1p19f7fte5s73br93k0-a.oregon-postgres.render.com',
  port: 5432,
  user: 'certificate_db_44nb_user',
  password: 'bjfK6mi1OXHXE0tYBw8YjtzrWOHX6EhM',
  database: 'certificate_db_44nb',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

async function createSampleCertificateWithQR() {
  const pool = new Pool(poolConfig);
  
  try {
    console.log('🔄 Creating sample certificate with QR code...');
    
    // Generate sample data
    const currentDate = new Date().toISOString();
    const randomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const refNo = `SAMPLE_QR_G35_2025_${randomId}`;
    const verificationUrl = `https://certificate-automation-dmoe.onrender.com/verify/${refNo}`;
    
    // Sample certificate data
    const sampleData = {
      full_name: 'John Doe Sample',
      email_address: 'john.doe.sample@example.com',
      phone: '+1-555-0123',
      course_name: 'Advanced JavaScript Development',
      batch_initials: 'G35',
      certificate_type: 'completion',
      status: 'generated',
      gpa: '9.5',
      attendance_percentage: 95,
      assessment_score: 92,
      start_date: '2024-11-01',
      end_date: '2025-01-15',
      training_hours: 120,
      organization: 'SURE Trust',
      position: 'Student'
    };
    
    console.log('📄 Sample Data:', {
      refNo,
      verificationUrl,
      studentName: sampleData.full_name,
      course: sampleData.course_name
    });
    
    // Generate QR Code
    console.log('🔄 Generating QR code...');
    const qrCodeData = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    console.log('✅ QR Code generated successfully!');
    console.log('📊 QR Code data length:', qrCodeData.length);
    console.log('🔗 Verification URL:', verificationUrl);
    
    // Start database transaction
    await pool.query('BEGIN');
    
    // 1. Insert form submission
    console.log('🔄 Inserting form submission...');
    const submissionQuery = `
      INSERT INTO form_submissions (
        full_name, email_address, phone, course_name, batch_initials,
        certificate_type, status, gpa, attendance_percentage, assessment_score,
        start_date, end_date, training_hours, organization, position,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING submission_id
    `;
    
    const submissionResult = await pool.query(submissionQuery, [
      sampleData.full_name,
      sampleData.email_address,
      sampleData.phone,
      sampleData.course_name,
      sampleData.batch_initials,
      sampleData.certificate_type,
      sampleData.status,
      sampleData.gpa,
      sampleData.attendance_percentage,
      sampleData.assessment_score,
      sampleData.start_date,
      sampleData.end_date,
      sampleData.training_hours,
      sampleData.organization,
      sampleData.position
    ]);
    
    const submissionId = submissionResult.rows[0].submission_id;
    console.log('✅ Form submission created with ID:', submissionId);
    
    // 2. Insert certificate generation record
    console.log('🔄 Inserting certificate generation record...');
    const certificateQuery = `
      INSERT INTO certificate_generations (
        submission_id, certificate_ref_no, verification_url, qr_code_data,
        certificate_image_path, certificate_pdf_path, 
        generated_at, generated_by, status, is_verified,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING certificate_id
    `;
    
    const imagePath = `Generated-Certificates/IMG/${refNo}.png`;
    const pdfPath = `Generated-Certificates/PDF/${refNo}.pdf`;
    
    const certificateResult = await pool.query(certificateQuery, [
      submissionId,
      refNo,
      verificationUrl,
      qrCodeData,
      imagePath,
      pdfPath,
      currentDate,
      'system_sample',
      'generated',
      true
    ]);
    
    const certificateId = certificateResult.rows[0].certificate_id;
    console.log('✅ Certificate generation record created with ID:', certificateId);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log('\n🎉 Sample certificate created successfully!');
    console.log('📋 Certificate Details:');
    console.log('   Reference Number:', refNo);
    console.log('   Verification URL:', verificationUrl);
    console.log('   Student Name:', sampleData.full_name);
    console.log('   Course:', sampleData.course_name);
    console.log('   Batch:', sampleData.batch_initials);
    console.log('   Status:', sampleData.status);
    console.log('   Submission ID:', submissionId);
    console.log('   Certificate ID:', certificateId);
    
    console.log('\n🔍 You can verify this certificate at:');
    console.log('   ', verificationUrl);
    
    console.log('\n📱 QR Code contains the verification URL and can be scanned to verify the certificate.');
    
    return {
      success: true,
      submissionId,
      certificateId,
      refNo,
      verificationUrl,
      qrCodeData
    };
    
  } catch (error) {
    // Rollback transaction on error
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Rollback error:', rollbackError.message);
    }
    
    console.error('❌ Error creating sample certificate:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return { success: false, error: error.message };
    
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createSampleCertificateWithQR()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Script completed successfully!');
        console.log('🔗 Test verification at:', result.verificationUrl);
      } else {
        console.log('\n❌ Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Script error:', error.message);
      process.exit(1);
    });
}

module.exports = { createSampleCertificateWithQR };
