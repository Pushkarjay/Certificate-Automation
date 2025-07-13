const productionGenerator = require('./services/simplifiedProductionCertificateGenerator');
const dbService = require('./services/databaseService');

/**
 * Create a sample certificate for the admin dashboard with database storage
 */
async function createSampleCertificateForDashboard() {
  try {
    console.log('🚀 Creating sample certificate for admin dashboard...');
    
    // Sample certificate data
    const sampleData = {
      name: 'Pushkarjay Ajay',
      full_name: 'Pushkarjay Ajay',
      email_address: 'pushkarjay@suretrust.org',
      course_name: 'FULL STACK DEVELOPMENT',
      course: 'FULL STACK DEVELOPMENT',
      batch_initials: 'G30',
      batch: 'G30',
      start_date: '2025-01-01',
      end_date: '2025-05-01',
      gpa: '9.2',
      certificate_type: 'student',
      type: 'completion'
    };
    
    console.log('📋 Sample Data:', sampleData);
    
    // Insert form submission record
    console.log('📝 Inserting form submission record...');
    const submissionQuery = `
      INSERT INTO form_submissions (
        timestamp, email_address, full_name, course_name, 
        batch_initials, start_date, end_date, gpa, 
        certificate_type, status, form_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING submission_id
    `;
    
    const submissionParams = [
      new Date(),
      sampleData.email_address,
      sampleData.full_name,
      sampleData.course_name,
      sampleData.batch_initials,
      sampleData.start_date,
      sampleData.end_date,
      parseFloat(sampleData.gpa),
      sampleData.certificate_type,
      'approved',
      'admin_sample'
    ];
    
    const submissionResult = await dbService.query(submissionQuery, submissionParams);
    const submissionId = submissionResult.rows[0].submission_id;
    console.log('✅ Form submission created with ID:', submissionId);
    
    // Generate certificate using production generator
    console.log('🔄 Generating certificate...');
    const certificateResult = await productionGenerator.generateProductionCertificate(sampleData);
    
    // Insert certificate generation record
    console.log('📄 Inserting certificate generation record...');
    const certQuery = `
      INSERT INTO certificate_generations (
        submission_id, certificate_ref_no, verification_url,
        certificate_pdf_path, certificate_image_path,
        generated_at, status, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING certificate_id
    `;
    
    const certParams = [
      submissionId,
      certificateResult.certificateData.referenceNumber,
      certificateResult.certificateData.verificationUrl,
      certificateResult.pdfPath,
      certificateResult.imagePath,
      new Date(),
      'generated',
      true
    ];
    
    const certResult = await dbService.query(certQuery, certParams);
    const certificateId = certResult.rows[0].certificate_id;
    console.log('✅ Certificate generation record created with ID:', certificateId);
    
    // Update form submission status
    await dbService.query(
      'UPDATE form_submissions SET status = $1 WHERE submission_id = $2',
      ['generated', submissionId]
    );
    
    console.log('🎉 Sample certificate created successfully for admin dashboard!');
    console.log('📋 Certificate Details:');
    console.log(`   Reference Number: ${certificateResult.certificateData.referenceNumber}`);
    console.log(`   Verification URL: ${certificateResult.certificateData.verificationUrl}`);
    console.log(`   Student Name: ${sampleData.full_name}`);
    console.log(`   Course: ${sampleData.course_name}`);
    console.log(`   Batch: ${sampleData.batch_initials}`);
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Certificate ID: ${certificateId}`);
    console.log('');
    console.log('🔍 You can view this certificate in the admin dashboard at:');
    console.log('    http://localhost:3000/admin-dashboard.html');
    console.log('');
    console.log('🌐 Or verify it directly at:');
    console.log(`    ${certificateResult.certificateData.verificationUrl}`);
    console.log('');
    console.log('📁 Certificate files are stored in PostgreSQL database');
    console.log('✅ Script completed successfully!');
    
    return {
      submissionId,
      certificateId,
      referenceNumber: certificateResult.certificateData.referenceNumber,
      verificationUrl: certificateResult.certificateData.verificationUrl
    };
    
  } catch (error) {
    console.error('❌ Error creating sample certificate:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createSampleCertificateForDashboard()
    .then(() => {
      console.log('✅ Sample certificate creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create sample certificate:', error);
      process.exit(1);
    });
}

module.exports = createSampleCertificateForDashboard;
