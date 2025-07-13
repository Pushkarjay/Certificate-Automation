const { google } = require('googleapis');

async function testGoogleSheetsConnection() {
  try {
    console.log('🧪 Testing Google Sheets API connection...');
    
    // Test environment variable
    const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY environment variable found');
    } else {
      console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found');
    }
    
    // Use the same logic as your service
    const { getGoogleCredentials } = require('./Backend/services/googleAuth');
    const credentials = getGoogleCredentials();
    
    console.log('✅ Credentials loaded successfully');
    console.log('📧 Service account email:', credentials.client_email);
    
    // Test Google Sheets API authentication
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    console.log('🔐 JWT authentication created');
    
    // Initialize the Sheets API
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('📊 Google Sheets API initialized');
    
    // Test accessing the specific spreadsheet
    const spreadsheetId = '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU';
    const range = 'Form Responses 1!A1:Z10'; // Get first 10 rows for testing
    
    console.log(`🔍 Testing access to spreadsheet: ${spreadsheetId}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values;
    if (rows && rows.length > 0) {
      console.log(`✅ Successfully fetched ${rows.length} rows from Google Sheet`);
      console.log('📋 First row (headers):', rows[0]);
      if (rows.length > 1) {
        console.log('📋 Second row (sample data):', rows[1]);
      }
    } else {
      console.log('⚠️ No data found in the sheet');
    }
    
    console.log('🎉 Google Sheets API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Google Sheets API test failed:', error.message);
    
    if (error.code === 403) {
      console.error('📝 Permission denied. Make sure:');
      console.error('   1. The Google Sheet is shared with: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com');
      console.error('   2. The service account has at least "Viewer" permission');
    } else if (error.code === 404) {
      console.error('📝 Sheet not found. Check the spreadsheet ID');
    } else {
      console.error('📝 Error details:', error);
    }
  }
}

testGoogleSheetsConnection();
