// scripts/decode-service-account.js

const fs = require('fs');
const path = require('path');

const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!base64Key) {
  console.error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set!');
  process.exit(1);
}

try {
  // Decode and write to file
  const json = Buffer.from(base64Key, 'base64').toString('utf-8');
  const filePath = path.join(__dirname, '..', 'service-account.json');
  fs.writeFileSync(filePath, json, { encoding: 'utf-8' });
  console.log('✅ Google service account key decoded and written to service-account.json');
} catch (err) {
  console.error('❌ Failed to decode/write service account key:', err);
  process.exit(1);
}