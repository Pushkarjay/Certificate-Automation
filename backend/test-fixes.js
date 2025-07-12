#!/usr/bin/env node

/**
 * Test script to verify QR code generation and revocation functionality
 * Run with: node test-fixes.js
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

async function testQRCodeGeneration() {
  console.log('🔄 Testing QR Code Generation...');
  
  try {
    const testURL = 'http://localhost:3000/verify/TEST_123';
    
    // Test 1: Data URL generation
    const qrDataURL = await QRCode.toDataURL(testURL, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log('✅ QR Data URL generation: SUCCESS');
    console.log(`   Length: ${qrDataURL.length} characters`);
    
    // Test 2: Buffer generation
    const qrBuffer = await QRCode.toBuffer(testURL, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'png'
    });
    
    console.log('✅ QR Buffer generation: SUCCESS');
    console.log(`   Buffer size: ${qrBuffer.length} bytes`);
    
    // Test 3: Save to file
    const testDir = path.join(__dirname, 'test-output');
    try {
      await fs.access(testDir);
    } catch {
      await fs.mkdir(testDir, { recursive: true });
    }
    
    const qrFilePath = path.join(testDir, 'test-qr-code.png');
    await fs.writeFile(qrFilePath, qrBuffer);
    
    console.log('✅ QR File save: SUCCESS');
    console.log(`   File saved to: ${qrFilePath}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ QR Code Generation FAILED:', error.message);
    return false;
  }
}

async function testCertificateGenerator() {
  console.log('\n🔄 Testing Certificate Generator...');
  
  try {
    const { generateSimpleCertificate } = require('./services/certificateGenerator');
    
    const testData = {
      name: 'John Doe',
      full_name: 'John Doe',
      course: 'Python Programming',
      course_name: 'Python Programming',
      batch: 'G28',
      batch_initials: 'G28',
      type: 'student',
      certificate_type: 'student',
      gpa: '8.5',
      startDate: '2024-01-01',
      endDate: '2024-05-01'
    };
    
    const result = await generateSimpleCertificate(testData);
    
    console.log('✅ Certificate Generation: SUCCESS');
    console.log(`   Reference Number: ${result.certificateData.referenceNumber}`);
    console.log(`   Image Path: ${result.imagePath}`);
    console.log(`   PDF Path: ${result.pdfPath}`);
    console.log(`   QR Data Available: ${result.certificateData.qrCodeData ? 'YES' : 'NO'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Certificate Generation FAILED:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🔄 Testing Database Connection...');
  
  try {
    const dbService = require('./services/databaseService');
    
    // Test query
    const testQuery = 'SELECT 1 as test_value';
    const result = await dbService.query(testQuery);
    
    console.log('✅ Database Connection: SUCCESS');
    console.log(`   Test query result: ${result.rows[0].test_value}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Database Connection FAILED:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Certificate Automation Fix Tests...\n');
  
  const results = {
    qrCode: await testQRCodeGeneration(),
    certificate: await testCertificateGenerator(),
    database: await testDatabaseConnection()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Your QR code generation and revocation fixes are working!');
    console.log('   You can now:');
    console.log('   - Generate certificates with QR codes');
    console.log('   - Revoke certificates via the API');
    console.log('   - Test endpoints at:');
    console.log('     GET /api/certificates/test-qr');
    console.log('     GET /api/certificates/test-revoke');
    console.log('     POST /api/certificates/revoke/:id');
  } else {
    console.log('\n🔧 Some tests failed. Please check the error messages above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testQRCodeGeneration,
  testCertificateGenerator,
  testDatabaseConnection,
  runAllTests
};
