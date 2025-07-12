#!/usr/bin/env node

/**
 * Enhanced Certificate Generator with QR Code Integration
 * This script generates a proper certificate with QR code embedded in the image
 */

const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// Database configuration
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

async function createCertificateWithQR() {
  const pool = new Pool(poolConfig);
  
  try {
    console.log('🔄 Creating enhanced certificate with embedded QR code...');
    
    // Generate new sample data
    const currentDate = new Date().toISOString();
    const randomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const refNo = `QR_CERT_G40_2025_${randomId}`;
    const verificationUrl = `https://certificate-automation-dmoe.onrender.com/verify/${refNo}`;
    
    // Enhanced sample certificate data
    const sampleData = {
      full_name: 'Sarah Johnson',
      email_address: 'sarah.johnson@example.com',
      phone: '+1-555-0789',
      course_name: 'Full Stack Web Development',
      batch_initials: 'G40',
      certificate_type: 'completion',
      status: 'generated',
      gpa: '9.8',
      attendance_percentage: 98,
      assessment_score: 96,
      start_date: '2024-12-01',
      end_date: '2025-03-15',
      training_hours: 160,
      organization: 'SURE Trust',
      position: 'Student'
    };
    
    console.log('📄 Certificate Data:', {
      refNo,
      verificationUrl,
      studentName: sampleData.full_name,
      course: sampleData.course_name
    });
    
    // Generate high-quality QR code
    console.log('🔄 Generating high-quality QR code...');
    const qrCodeData = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 200,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H',
      type: 'png'
    });
    
    console.log('✅ QR Code generated successfully!');
    console.log('📊 QR Code data URL length:', qrCodeData.length);
    console.log('📊 QR Code buffer size:', qrCodeBuffer.length, 'bytes');
    
    // Create directories
    const imgDir = path.join(__dirname, 'Generated-Certificates', 'IMG');
    const pdfDir = path.join(__dirname, 'Generated-Certificates', 'PDF');
    
    await fs.mkdir(imgDir, { recursive: true });
    await fs.mkdir(pdfDir, { recursive: true });
    
    // Generate certificate paths
    const imagePath = path.join(imgDir, `${refNo}.png`);
    const pdfPath = path.join(pdfDir, `${refNo}.pdf`);
    
    // Create Enhanced PDF Certificate with QR Code
    console.log('🔄 Creating enhanced PDF certificate with QR code...');
    await createEnhancedPDFCertificate(sampleData, pdfPath, refNo, verificationUrl, qrCodeBuffer);
    
    // Create SVG Certificate with QR Code (as fallback for PNG)
    console.log('🔄 Creating SVG certificate with QR code...');
    await createSVGCertificateWithQR(sampleData, imagePath, refNo, verificationUrl, qrCodeData);
    
    // Store in database
    console.log('🔄 Storing certificate data in database...');
    await pool.query('BEGIN');
    
    // Insert form submission
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
      sampleData.full_name, sampleData.email_address, sampleData.phone,
      sampleData.course_name, sampleData.batch_initials, sampleData.certificate_type,
      sampleData.status, sampleData.gpa, sampleData.attendance_percentage,
      sampleData.assessment_score, sampleData.start_date, sampleData.end_date,
      sampleData.training_hours, sampleData.organization, sampleData.position
    ]);
    
    const submissionId = submissionResult.rows[0].submission_id;
    
    // Insert certificate generation record
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
    
    const certificateResult = await pool.query(certificateQuery, [
      submissionId, refNo, verificationUrl, qrCodeData,
      `Generated-Certificates/IMG/${refNo}.png`,
      `Generated-Certificates/PDF/${refNo}.pdf`,
      currentDate, 'enhanced_system', 'generated', true
    ]);
    
    const certificateId = certificateResult.rows[0].certificate_id;
    
    await pool.query('COMMIT');
    
    console.log('\n🎉 Enhanced certificate with QR code created successfully!');
    console.log('📋 Certificate Details:');
    console.log('   Reference Number:', refNo);
    console.log('   Verification URL:', verificationUrl);
    console.log('   Student Name:', sampleData.full_name);
    console.log('   Course:', sampleData.course_name);
    console.log('   Submission ID:', submissionId);
    console.log('   Certificate ID:', certificateId);
    console.log('   PDF Path:', pdfPath);
    console.log('   Image Path:', imagePath);
    
    console.log('\n✅ Features included:');
    console.log('   📱 QR Code embedded in certificate');
    console.log('   🔍 Scannable verification URL');
    console.log('   📄 High-quality PDF with QR code');
    console.log('   🖼️ SVG image with QR code');
    console.log('   💾 Database entry with QR data');
    
    return {
      success: true,
      refNo,
      verificationUrl,
      submissionId,
      certificateId,
      imagePath,
      pdfPath
    };
    
  } catch (error) {
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Rollback error:', rollbackError.message);
    }
    
    console.error('❌ Error creating enhanced certificate:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return { success: false, error: error.message };
    
  } finally {
    await pool.end();
  }
}

async function createEnhancedPDFCertificate(data, pdfPath, refNo, verificationUrl, qrCodeBuffer) {
  const pdfDoc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 }
  });
  
  const pdfStream = require('fs').createWriteStream(pdfPath);
  pdfDoc.pipe(pdfStream);
  
  // Certificate border
  pdfDoc.rect(20, 20, pdfDoc.page.width - 40, pdfDoc.page.height - 40)
         .stroke('#2c3e50');
  
  // Header
  pdfDoc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('CERTIFICATE OF COMPLETION', 50, 80, { align: 'center' });
  
  // Organization
  pdfDoc.fontSize(16)
         .font('Helvetica')
         .fillColor('#34495e')
         .text('SURE Trust Technology Training Institute', 50, 120, { align: 'center' });
  
  // Main content
  pdfDoc.fontSize(14)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text('This is to certify that', 50, 180, { align: 'center' });
  
  pdfDoc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#e74c3c')
         .text(data.full_name, 50, 210, { align: 'center' });
  
  pdfDoc.fontSize(14)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text('has successfully completed the course', 50, 250, { align: 'center' });
  
  pdfDoc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#3498db')
         .text(data.course_name, 50, 280, { align: 'center' });
  
  // Details
  pdfDoc.fontSize(12)
         .font('Helvetica')
         .fillColor('#34495e')
         .text(`Batch: ${data.batch_initials}`, 60, 330)
         .text(`Duration: ${data.training_hours} hours`, 60, 350)
         .text(`GPA: ${data.gpa}`, 60, 370)
         .text(`Attendance: ${data.attendance_percentage}%`, 60, 390);
  
  // Reference number
  pdfDoc.fontSize(10)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text(`Certificate Reference: ${refNo}`, 60, 450)
         .text(`Verification URL: ${verificationUrl}`, 60, 465);
  
  // Add QR code if available
  if (qrCodeBuffer) {
    pdfDoc.image(qrCodeBuffer, pdfDoc.page.width - 160, 330, { width: 120, height: 120 });
    pdfDoc.fontSize(10)
           .fillColor('#7f8c8d')
           .text('Scan QR code to verify', pdfDoc.page.width - 160, 460, { width: 120, align: 'center' });
  }
  
  // Date and signature area
  pdfDoc.fontSize(12)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text(`Date: ${new Date().toLocaleDateString()}`, 60, 480)
         .text('Authorized Signature: ___________________', 400, 480);
  
  pdfDoc.end();
  
  return new Promise((resolve, reject) => {
    pdfStream.on('finish', () => {
      console.log('✅ Enhanced PDF certificate with QR code created');
      resolve();
    });
    pdfStream.on('error', reject);
  });
}

async function createSVGCertificateWithQR(data, imagePath, refNo, verificationUrl, qrCodeData) {
  const svgContent = `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#f8f9fa" stroke="#2c3e50" stroke-width="4"/>
  
  <!-- Header -->
  <text x="400" y="80" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#2c3e50">
    CERTIFICATE OF COMPLETION
  </text>
  
  <!-- Organization -->
  <text x="400" y="110" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#34495e">
    SURE Trust Technology Training Institute
  </text>
  
  <!-- Certificate text -->
  <text x="400" y="160" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#2c3e50">
    This is to certify that
  </text>
  
  <!-- Student name -->
  <text x="400" y="200" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e74c3c">
    ${data.full_name}
  </text>
  
  <!-- Course completion text -->
  <text x="400" y="240" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#2c3e50">
    has successfully completed the course
  </text>
  
  <!-- Course name -->
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#3498db">
    ${data.course_name}
  </text>
  
  <!-- Details -->
  <text x="60" y="350" font-family="Arial, sans-serif" font-size="11" fill="#34495e">
    Batch: ${data.batch_initials}
  </text>
  <text x="60" y="370" font-family="Arial, sans-serif" font-size="11" fill="#34495e">
    Duration: ${data.training_hours} hours
  </text>
  <text x="60" y="390" font-family="Arial, sans-serif" font-size="11" fill="#34495e">
    GPA: ${data.gpa}
  </text>
  <text x="60" y="410" font-family="Arial, sans-serif" font-size="11" fill="#34495e">
    Attendance: ${data.attendance_percentage}%
  </text>
  
  <!-- QR Code area -->
  <rect x="600" y="320" width="140" height="140" fill="#ffffff" stroke="#ddd" stroke-width="1"/>
  <image x="620" y="340" width="100" height="100" href="${qrCodeData}"/>
  <text x="670" y="480" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" fill="#7f8c8d">
    Scan to verify
  </text>
  
  <!-- Reference number -->
  <text x="60" y="520" font-family="Arial, sans-serif" font-size="9" fill="#7f8c8d">
    Certificate Reference: ${refNo}
  </text>
  
  <!-- Date -->
  <text x="60" y="550" font-family="Arial, sans-serif" font-size="11" fill="#2c3e50">
    Date: ${new Date().toLocaleDateString()}
  </text>
  
  <!-- Signature line -->
  <text x="500" y="550" font-family="Arial, sans-serif" font-size="11" fill="#2c3e50">
    Authorized Signature: ___________________
  </text>
</svg>`;
  
  await fs.writeFile(imagePath.replace('.png', '.svg'), svgContent);
  console.log('✅ SVG certificate with embedded QR code created');
}

// Run the script
if (require.main === module) {
  createCertificateWithQR()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Enhanced certificate creation completed!');
        console.log('🔍 Test the certificate at:', result.verificationUrl);
        console.log('\n📁 Files created:');
        console.log('   PDF:', result.pdfPath);
        console.log('   SVG:', result.imagePath.replace('.png', '.svg'));
      } else {
        console.log('\n❌ Certificate creation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Script error:', error.message);
      process.exit(1);
    });
}

module.exports = { createCertificateWithQR };
