// Quick diagnostic for Google Sheets API issues
console.log('🔍 Diagnosing Google Sheets API issues...');

// Check 1: Environment variable setup
console.log('\n1. Environment Variable Check:');
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY is set');
  
  try {
    const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);
    console.log('✅ Base64 decoding successful');
    console.log('📧 Service account email:', credentials.client_email);
  } catch (error) {
    console.log('❌ Failed to decode environment variable:', error.message);
  }
} else {
  console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found');
}

// Check 2: Google API scope and permissions
console.log('\n2. Common Issues and Solutions:');
console.log('📝 Make sure the Google Sheet is shared with:');
console.log('   sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com');
console.log('📝 The service account needs "Viewer" permission on the sheet');
console.log('📝 Sheet ID: 1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU');

// Check 3: Test basic Google Sheets API
async function testBasicConnection() {
  try {
    console.log('\n3. Testing Google Sheets API...');
    
    const { google } = require('googleapis');
    const { getGoogleCredentials } = require('./services/googleAuth');
    
    const credentials = getGoogleCredentials();
    console.log('✅ Credentials loaded from googleAuth service');
    
    // Test authentication
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    // Test auth by getting access token
    const accessToken = await auth.getAccessToken();
    console.log('✅ JWT authentication successful');
    
    // Test sheets API initialization
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized');
    
    // Test minimal API call
    const spreadsheetId = '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU';
    console.log('🔍 Testing access to spreadsheet...');
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      includeGridData: false
    });
    
    console.log('✅ Spreadsheet access successful!');
    console.log('📊 Sheet title:', response.data.properties.title);
    console.log('📋 Available sheets:', response.data.sheets.map(s => s.properties.title));
    
    return true;
    
  } catch (error) {
    console.log('❌ Google Sheets API test failed:', error.message);
    
    if (error.status === 403) {
      console.log('📝 PERMISSION DENIED - The service account doesn\'t have access to the sheet');
      console.log('📝 Solution: Share the Google Sheet with the service account email');
    } else if (error.status === 404) {
      console.log('📝 SHEET NOT FOUND - Check the spreadsheet ID');
    } else if (error.message.includes('private_key')) {
      console.log('📝 INVALID PRIVATE KEY - Check the service account JSON format');
    }
    
    return false;
  }
}

if (require.main === module) {
  testBasicConnection().then(success => {
    if (success) {
      console.log('\n🎉 Google Sheets API is working correctly!');
      console.log('📝 If sync is still failing, check the data processing logic');
    } else {
      console.log('\n❌ Google Sheets API has issues that need to be resolved');
    }
  });
}
