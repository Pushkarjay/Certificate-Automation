#!/usr/bin/env node

/**
 * Cleanup Script for Certificate Automation System
 * Removes redundant files before GitHub push
 */

const fs = require('fs').promises;
const path = require('path');

async function cleanupProject() {
  console.log('🧹 Starting project cleanup...\n');

  const filesToDelete = [
    // Redundant test files (keeping only the comprehensive test)
    'Backend/test-cert.js',          // Basic test - redundant
    'Backend/test-qr.js',            // QR test - covered in main test
    'Backend/test-fixes.js',         // Empty file
    'Backend/test-certificate-generation.js', // Basic test - redundant
    'Backend/test-enhanced-certificates.js',  // Covered by production test
    'Backend/test-template-missing.js',       // Covered by production test
    
    // Development/utility files that aren't needed in production
    'Backend/create-qr-certificate.js',    // Development utility
    'Backend/generate-sample-files.js',    // Development utility
    'Backend/test-api.js',                 // Basic API test
    
    // Reset/cleanup utilities (keep main ones)
    'Backend/clean-files.js',
    'Backend/clear-database.js',
    'Backend/complete-reset.js',
    'Backend/reset-database-with-sample.js',
    'Backend/reset-summary.md'
  ];

  let deletedCount = 0;
  let errorCount = 0;

  console.log('📋 Files to delete:');
  for (const file of filesToDelete) {
    const filePath = path.join(__dirname, '..', file);
    console.log(`   - ${file}`);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      deletedCount++;
      console.log(`   ✅ Deleted: ${file}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`   ⚠️ Not found: ${file}`);
      } else {
        console.log(`   ❌ Error deleting ${file}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n🧹 Cleaning up generated test certificates...');
  
  // Clean up test certificates (keep .gitkeep files)
  const generatedDirs = [
    'Backend/Generated-Certificates/PDF',
    'Backend/Generated-Certificates/IMG'
  ];

  let certificatesDeleted = 0;

  for (const dir of generatedDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file !== '.gitkeep' && file !== 'README.md') {
          const filePath = path.join(dirPath, file);
          try {
            await fs.unlink(filePath);
            certificatesDeleted++;
          } catch (error) {
            console.log(`   ❌ Error deleting certificate ${file}: ${error.message}`);
            errorCount++;
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error accessing directory ${dir}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`   ✅ Deleted ${certificatesDeleted} test certificates`);

  console.log('\n📊 Cleanup Summary:');
  console.log(`   📄 Files deleted: ${deletedCount}`);
  console.log(`   📜 Certificates deleted: ${certificatesDeleted}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  console.log('\n✅ Core files kept:');
  console.log('   📋 Production Files:');
  console.log('      - Backend/server.js (main server)');
  console.log('      - Backend/services/certificateGenerator.js (main generator)');
  console.log('      - Backend/services/productionCertificateGenerator.js (cloud-optimized)');
  console.log('      - Backend/test-production-certificates.js (comprehensive test)');
  console.log('      - Backend/create-sample-certificate.js (sample generation)');
  console.log('   📋 Documentation:');
  console.log('      - Backend/PRODUCTION-DEPLOYMENT-SUMMARY.md');
  console.log('      - Backend/CERTIFICATE_GENERATION_DOCUMENTATION.md');
  console.log('   📋 Templates:');
  console.log('      - Backend/Certificate_Templates/ (21 templates)');
  console.log('   📋 Configuration:');
  console.log('      - package.json, render.yaml, etc.');

  if (errorCount === 0) {
    console.log('\n🎉 Cleanup completed successfully! Ready for GitHub push.');
  } else {
    console.log(`\n⚠️ Cleanup completed with ${errorCount} errors. Please review before pushing.`);
  }

  return { deletedCount, certificatesDeleted, errorCount };
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupProject()
    .then((result) => {
      process.exit(result.errorCount === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanupProject };
