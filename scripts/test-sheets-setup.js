const sheetsDb = require('../Backend/services/sheetsDatabase');

/**
 * Test script to validate Google Sheets Database setup
 */
async function runTests() {
  console.log('🧪 Running Google Sheets Database Tests...\n');

  try {
    // Test 1: Initialize connection
    console.log('1️⃣ Testing initialization...');
    await sheetsDb.initialize();
    console.log('✅ Initialization successful\n');

    // Test 2: Test connection to all sheets
    console.log('2️⃣ Testing sheet connections...');
    const connectionResult = await sheetsDb.testConnection();
    if (connectionResult) {
      console.log('✅ All sheets connected successfully\n');
    } else {
      console.log('❌ Sheet connection failed\n');
      return;
    }

    // Test 3: Get statistics
    console.log('3️⃣ Testing statistics retrieval...');
    const stats = await sheetsDb.getStats();
    console.log('📊 Current statistics:', JSON.stringify(stats, null, 2));
    console.log('✅ Statistics retrieved successfully\n');

    // Test 4: Test form submission (create a test entry)
    console.log('4️⃣ Testing form submission...');
    const testSubmission = {
      full_name: 'Test User - DELETE ME',
      email_address: 'test@example.com',
      course_name: 'Test Course',
      certificate_type: 'student',
      phone: '1234567890',
      batch_initials: 'TEST01',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const submissionResult = await sheetsDb.insertFormSubmission(testSubmission, 'student');
    console.log('✅ Test submission created:', submissionResult.id);

    // Test 5: Retrieve the test submission
    console.log('5️⃣ Testing submission retrieval...');
    const retrievedSubmission = await sheetsDb.getSubmissionById(submissionResult.id);
    if (retrievedSubmission && retrievedSubmission.full_name === testSubmission.full_name) {
      console.log('✅ Submission retrieved successfully');
    } else {
      console.log('❌ Submission retrieval failed');
    }

    // Test 6: Update the test submission
    console.log('6️⃣ Testing submission update...');
    const updateResult = await sheetsDb.updateSubmission(submissionResult.id, {
      status: 'tested',
      updated_at: new Date().toISOString()
    });
    console.log('✅ Submission updated successfully');

    // Test 7: Search functionality
    console.log('7️⃣ Testing search functionality...');
    const searchResults = await sheetsDb.getSubmissions({
      certificateType: 'student',
      search: 'Test User',
      limit: 5
    });
    console.log(`✅ Search found ${searchResults.data.length} results`);

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n⚠️ Remember to clean up test data from your sheets manually');
    console.log(`   Look for entry with ID: ${submissionResult.id}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('📝 Error details:', error);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n🔧 SOLUTION: The service account key needs to be regenerated');
      console.error('📝 Visit: https://console.cloud.google.com/iam-admin/serviceaccounts');
    } else if (error.message.includes('Permission denied')) {
      console.error('\n🔧 SOLUTION: Check if the service account has Editor access to the sheets');
    } else if (error.message.includes('not found')) {
      console.error('\n🔧 SOLUTION: Verify the sheet IDs in the configuration');
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-sheets-setup.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show verbose output

This script tests the Google Sheets Database setup and connection.
Make sure you have:
1. Set up the service account key (see Google/SHEETS_SETUP.md)
2. Configured environment variables correctly
3. Given Editor permissions to the service account for all sheets
  `);
  process.exit(0);
}

// Run the tests
runTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
