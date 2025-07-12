const fs = require('fs');
const path = require('path');

/**
 * Get Google Service Account credentials
 * In production, reads from environment variable (base64 encoded)
 * In development, reads from local JSON file
 */
function getGoogleCredentials() {
  try {
    // Production: Read from environment variable
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Loading Google credentials from environment variable...');
      const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
      return JSON.parse(decodedKey);
    }
    
    // Development: Read from local file
    const credentialsPaths = [
      path.join(__dirname, '..', '..', 'opportune-sylph-458214-b8-490493912c83.json'),
      path.join(__dirname, '..', '..', 'opportune-sylph-458214-b8-74a78b125fe6.json'),
      path.join(__dirname, '..', '..', 'confidential-templates', 'opportune-sylph-458214-b8-74a78b125fe6.json')
    ];
    
    for (const credPath of credentialsPaths) {
      if (fs.existsSync(credPath)) {
        console.log('🔑 Loading Google credentials from local file...');
        const credentialsContent = fs.readFileSync(credPath, 'utf8');
        return JSON.parse(credentialsContent);
      }
    }
    
    throw new Error('Google Service Account credentials not found');
    
  } catch (error) {
    console.error('❌ Error loading Google credentials:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('📝 Make sure GOOGLE_SERVICE_ACCOUNT_KEY environment variable is set');
      console.error('📝 Encode your JSON file: base64 -i your-service-account.json');
    } else {
      console.error('📝 Make sure your service account JSON file exists in the project root');
    }
    
    throw error;
  }
}

/**
 * Initialize Google services with credentials
 */
function initializeGoogleServices() {
  try {
    const credentials = getGoogleCredentials();
    
    // Here you would initialize your Google services
    // For example, if using Google Sheets API:
    // const { google } = require('googleapis');
    // const auth = new google.auth.GoogleAuth({
    //   credentials: credentials,
    //   scopes: ['https://www.googleapis.com/auth/spreadsheets']
    // });
    
    console.log('✅ Google services initialized successfully');
    return credentials;
    
  } catch (error) {
    console.error('❌ Failed to initialize Google services:', error.message);
    throw error;
  }
}

module.exports = {
  getGoogleCredentials,
  initializeGoogleServices
};
