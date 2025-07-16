# Google Service Account Setup Instructions

## Step 1: Create Service Account Key

1. Go to the Google Cloud Console: https://console.cloud.google.com/
2. Select your project `sure-trust-1`
3. Navigate to IAM & Admin > Service Accounts
4. Find the service account: `form-editor@sure-trust-1.iam.gserviceaccount.com`
5. Click on the service account email
6. Go to the "Keys" tab
7. Click "Add Key" > "Create new key"
8. Select JSON format
9. Download the key file

## Step 2: Configure Environment Variables

### For Development:
1. Save the downloaded JSON file as `sure-trust-1-service-account.json` in the project root
2. The application will automatically load it from this location

### For Production (Render):
1. Convert the JSON file to base64:
   ```bash
   # On Linux/Mac:
   base64 -i sure-trust-1-service-account.json
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("sure-trust-1-service-account.json"))
   ```

2. Copy the base64 string and set it as the `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable in Render

## Step 3: Verify Permissions

Make sure the service account has the following permissions:
- Editor access to all three Google Sheets:
  - Trainer Sheet: https://docs.google.com/spreadsheets/d/1mPZWEFwLdqi9rKYzrxQtzG3vDHo52DmrnwGTkG0jHsw/edit
  - Trainee Sheet: https://docs.google.com/spreadsheets/d/18GpdPOxHA4x1Y1VBefpBKbQzxR5NaVPWFra3EEbP9dQ/edit
  - Student Sheet: https://docs.google.com/spreadsheets/d/1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU/edit

## Step 4: Environment Variables for Render

Set these environment variables in your Render dashboard:

```
GOOGLE_SERVICE_ACCOUNT_KEY=[base64 encoded JSON key]
NODE_ENV=production
VERIFICATION_BASE_URL=https://certificate-automation-dmoe.onrender.com/verify/
CERTIFICATE_BASE_URL=https://certificate-automation-dmoe.onrender.com
PORT=3000
```

## Troubleshooting

### Common Issues:
1. **Authentication Error**: Check if the service account key is valid and properly base64 encoded
2. **Permission Denied**: Ensure the service account has Editor access to all sheets
3. **Sheet Not Found**: Verify the sheet IDs in the environment configuration

### Testing Connection:
Visit `/health` endpoint to check if Google Sheets connection is working:
- Development: http://localhost:3000/health
- Production: https://certificate-automation-dmoe.onrender.com/health

### Support:
If you encounter issues, check the server logs for detailed error messages.
