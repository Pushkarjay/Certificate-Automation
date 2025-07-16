// Certificate Binary Storage Migration Script
// This script migrates existing certificate files to database binary storage

const fs = require('fs').promises;
const path = require('path');
const dbService = require('../backend/services/databaseService');

async function migrateCertificatesToBinaryStorage() {
  console.log('🔄 Starting certificate binary storage migration...');
  
  try {
    // Get all certificates that need migration
    const query = `
      SELECT 
        certificate_ref_no,
        certificate_pdf_path,
        certificate_image_path
      FROM certificate_generations 
      WHERE certificate_pdf_data IS NULL 
      AND certificate_pdf_path IS NOT NULL
    `;
    
    const result = await dbService.query(query);
    console.log(`📋 Found ${result.rows.length} certificates to migrate`);
    
    if (result.rows.length === 0) {
      console.log('✅ No certificates need migration');
      return;
    }
    
    let migrated = 0;
    let failed = 0;
    
    for (const cert of result.rows) {
      try {
        console.log(`📄 Processing ${cert.certificate_ref_no}...`);
        
        // Check if PDF file exists
        const pdfPath = path.join(__dirname, '..', cert.certificate_pdf_path);
        
        try {
          await fs.access(pdfPath);
          console.log(`✅ Found PDF file: ${pdfPath}`);
          
          // Read PDF file
          const pdfData = await fs.readFile(pdfPath);
          console.log(`📊 PDF size: ${pdfData.length} bytes`);
          
          // Store in database
          const updateQuery = `
            UPDATE certificate_generations 
            SET 
              certificate_pdf_data = $1,
              file_type = 'pdf',
              content_type = 'application/pdf',
              file_size_bytes = $2
            WHERE certificate_ref_no = $3
          `;
          
          await dbService.query(updateQuery, [pdfData, pdfData.length, cert.certificate_ref_no]);
          console.log(`✅ Migrated ${cert.certificate_ref_no} to binary storage`);
          migrated++;
          
        } catch (fileError) {
          console.warn(`⚠️ PDF file not found for ${cert.certificate_ref_no}: ${pdfPath}`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ Error migrating ${cert.certificate_ref_no}:`, error.message);
        failed++;
      }
    }
    
    console.log('🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCertificatesToBinaryStorage();
}

module.exports = { migrateCertificatesToBinaryStorage };
