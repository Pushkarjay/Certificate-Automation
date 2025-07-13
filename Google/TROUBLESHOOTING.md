# Google Forms Sync - Troubleshooting & Setup Guide

## Current Status: ❌ Google Forms Sync Not Working

### Issues Identified:

1. **Missing Form Configuration**: Form URLs are still placeholders
2. **Hardcoded Form ID**: Apps Script contains a specific form ID that may not exist
3. **Field Mapping Mismatch**: Form fields may not match the expected field names
4. **Missing Triggers**: Form submission triggers may not be properly configured

## Step-by-Step Fix Guide

### 🔧 Step 1: API Connection Test (✅ WORKING)

The backend API is working correctly:
- ✅ Local API: `http://localhost:3000/api/forms/submit`
- ✅ Deployed API: `https://certificate-automation-dmoe.onrender.com/api/forms/submit`
- ✅ Successfully receives and processes form data
- ✅ Returns proper JSON responses with submission IDs

### 📝 Step 2: Create/Configure Google Forms

You need to create proper Google Forms. Here's what to do:

#### Option A: Create New Forms
1. Go to [Google Forms](https://forms.google.com)
2. Create forms with these exact field names (to match the field mapping):

**Student Certificate Form Fields:**
- Title (Dropdown): Mr, Ms, Dr, Prof
- FULL NAME (Text)
- Email Address (Email) 
- GENDER (Dropdown): MALE, FEMALE, OTHER
- DATE OF BIRTH (Date)
- Phone Number (Text)
- Course/Domain (Dropdown): PYTHON, JAVA, VLSI, etc.
- Batch (Text): G28, G15, etc.
- STRT DATE (Date)
- END DATE (Date)
- GPA (Number)
- Choose Your Role (Dropdown): Student, Intern (Trainee), Trainer

#### Option B: Update Existing Form
If you have existing forms, update the field names to match the mapping in the Apps Script.

### 📊 Step 3: Configure Google Sheets

1. Create a Google Sheet to collect form responses
2. Link your Google Form to this sheet
3. Update the `SHEET_ID` in the Apps Script configuration:
   ```javascript
   const CONFIG = {
     SHEET_ID: 'YOUR_ACTUAL_SHEET_ID_HERE', // Replace this
     // ... other config
   };
   ```

### ⚡ Step 4: Set Up Google Apps Script

1. **Copy the Scripts:**
   - Copy `certificate-form-automation.gs` to Google Apps Script
   - Copy `diagnostics.gs` to Google Apps Script

2. **Update Configuration:**
   ```javascript
   const CONFIG = {
     API_BASE_URL: 'https://certificate-automation-dmoe.onrender.com/api',
     FORM_SUBMIT_ENDPOINT: '/forms/submit',
     SHEET_ID: 'YOUR_GOOGLE_SHEET_ID', // Update this!
     MAX_RETRIES: 3,
     RETRY_DELAY: 1000
   };
   ```

3. **Run Diagnostics:**
   - Execute `runFullDiagnostics()` function
   - This will test all connections and identify issues

4. **Create Triggers:**
   - Run `createTriggerForForm('YOUR_FORM_ID')` for each form
   - Or use `quickFix()` to attempt automatic setup

### 🔍 Step 5: Run Diagnostics

Execute these functions in Google Apps Script:

```javascript
// Run comprehensive diagnostics
runFullDiagnostics();

// Quick attempt to fix common issues
quickFix();

// Test API connection specifically
testAPIConnection();

// Create trigger for a specific form
createTriggerForForm('1FAIpQLSfI19mehpVH35xAp5TtnAeFjbow40rN8Fo0-1JSchnJiglgSg');
```

### 🎯 Step 6: Test the Integration

1. **Submit a test form response**
2. **Check the Apps Script logs** (View > Logs)
3. **Verify data appears in Google Sheets**
4. **Check backend database** for new submissions

### 🐛 Common Issues & Solutions

#### Issue: "Form not found" error
**Solution:** Update the form ID in `createFormTrigger()` function or use the new diagnostic script.

#### Issue: Field mapping errors
**Solution:** Check that form field names match the mapping in `getFieldMapping()` function.

#### Issue: API connection timeout
**Solution:** Verify the backend is deployed and accessible at the configured URL.

#### Issue: Permission denied
**Solution:** Ensure the Apps Script has necessary permissions (Forms, Sheets, External URLs).

## Quick Test Commands

### Test Backend API (PowerShell):
```powershell
# Test local backend
Invoke-WebRequest -Uri "http://localhost:3000/api/forms/submit" -Method POST -ContentType "application/json" -Body '{"full_name":"Test User","email_address":"test@example.com","course_name":"PYTHON","certificate_type":"student"}'

# Test deployed backend
Invoke-WebRequest -Uri "https://certificate-automation-dmoe.onrender.com/api/forms/submit" -Method POST -ContentType "application/json" -Body '{"full_name":"Test User","email_address":"test@example.com","course_name":"PYTHON","certificate_type":"student"}'
```

### Test Google Apps Script:
```javascript
// In Google Apps Script console
testAPIConnection();
runFullDiagnostics();
```

## Next Steps

1. **Immediate**: Run the diagnostic script to identify specific issues
2. **Short-term**: Create/configure the Google Forms with proper field names
3. **Medium-term**: Set up proper triggers and test the complete flow
4. **Long-term**: Add error handling and monitoring

## Files Updated/Created

1. ✅ `diagnostics.gs` - Comprehensive diagnostic tool
2. ✅ Backend API working correctly
3. ❓ Forms need to be configured
4. ❓ Triggers need to be set up
5. ❓ Sheet ID needs to be updated

## Contact & Support

- **Backend API**: ✅ Working (both local and deployed)
- **Google Apps Script**: ⚠️ Needs configuration
- **Google Forms**: ❌ Need to be created/configured
- **Integration**: ❌ Waiting for form setup

Run the diagnostics script first to get a detailed analysis of what specifically needs to be fixed!
