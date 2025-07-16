const fs = require('fs');
const path = require('path');

/**
 * Get Google Service Account credentials
 * In production, reads from environment variable (base64 encoded)
 * In development, reads from local JSON file
 */
function getGoogleCredentials() {
  try {
    // Development: Read from local file first (highest priority)
    const credentialsPaths = [
      path.join(__dirname, '..', '..', 'sure-trust-1-1a35a986a881.json')
    ];
    
    for (const credPath of credentialsPaths) {
      if (fs.existsSync(credPath)) {
        console.log('🔑 Loading Google credentials from local file...');
        const credentialsContent = fs.readFileSync(credPath, 'utf8');
        const credentials = JSON.parse(credentialsContent);
        
        // Ensure private key is properly formatted
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key
            .replace(/\\n/g, '\n')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        }
        
        return credentials;
      }
    }
    
    // Check for base64 encoded key in environment variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
      console.log('🔑 Loading Google credentials from environment variable (base64)...');
      const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8');
      const credentials = JSON.parse(decodedKey);
      
      // Fix private key formatting issues (Windows line endings, extra escaping)
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key
          .replace(/\\n/g, '\n')  // Replace escaped newlines
          .replace(/\r\n/g, '\n') // Replace Windows line endings
          .replace(/\r/g, '\n')   // Replace remaining carriage returns
          .trim();
      }
      
      return credentials;
    }
    
    // Production: Read from environment variable (non-base64)
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Loading Google credentials from environment variable...');
      const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
      return JSON.parse(decodedKey);
    }
    
    throw new Error('Google Service Account credentials not found');
    
  } catch (error) {
    console.error('❌ Error loading Google credentials:', error.message);
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
      console.error('📝 Error parsing base64 encoded service account key');
      console.error('📝 Make sure GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 contains valid base64 JSON');
    } else if (process.env.NODE_ENV === 'production') {
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
