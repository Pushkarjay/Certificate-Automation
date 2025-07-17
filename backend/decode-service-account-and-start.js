// Backend/decode-service-account-and-start.js
// This script decodes the base64 service account key and then starts the backend server.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!base64Key) {
  console.error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set!');
  process.exit(1);
}

try {
  // Decode and write to file
  const json = Buffer.from(base64Key, 'base64').toString('utf-8');
  const filePath = path.join(__dirname, '..', 'sure-trust-1-1a35a986a881.json');
  fs.writeFileSync(filePath, json, { encoding: 'utf-8' });
  console.log('✅ Google service account key decoded and written to sure-trust-1-1a35a986a881.json');
} catch (err) {
  console.error('❌ Failed to decode/write service account key:', err);
  process.exit(1);
}

// Start the backend server
execSync('node Backend/server.js', { stdio: 'inherit' });
