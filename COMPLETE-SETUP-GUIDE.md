# Certificate Automation Setup Guide

## Complete Google Form → Sheet → Database → Certificate Generation Workflow

This guide will help you set up the complete automation system that works with your existing Google Form.

## 🗄️ Step 1: Database Setup

### PostgreSQL Database Setup (Render)

1. **Connect to your PostgreSQL database** using the URL:
   ```
   postgresql://certificate_db_44nb_user:bjfK6mi1OXHXE0tYBw8YjtzrWOHX6EhM@dpg-d1p19f7fte5s73br93k0-a.oregon-postgres.render.com/certificate_db_44nb
   ```

2. **Run the new database schema**:
   ```bash
   # Upload and execute the new schema file
   psql -h dpg-d1p19f7fte5s73br93k0-a.oregon-postgres.render.com -U certificate_db_44nb_user -d certificate_db_44nb -f Database/PostgreSQL/form-based-schema.sql
   ```

   **OR** manually execute the SQL from `Database/PostgreSQL/form-based-schema.sql` in your database client.

## 🔗 Step 2: Google Apps Script Setup

### 2.1 Create Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Replace the default code with the content from `Google/Apps-Script/certificate-form-automation.gs`

### 2.2 Configure the Script

Update these configurations in the script:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://certificate-automation-dmoe.onrender.com/api',
  FORM_SUBMIT_ENDPOINT: '/forms/submit',
  SHEET_ID: '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};
```

### 2.3 Set Up Form Trigger

1. In Apps Script editor, click **"Triggers"** (clock icon)
2. Click **"Add Trigger"**
3. Configure:
   - Function: `onFormSubmit`
   - Event source: `From form`
   - Select your form: Choose your Google Form
   - Event type: `On form submit`
4. Click **"Save"**

### 2.4 Test the Setup

1. Run the `setupScript()` function to test API connection
2. Run the `testAPIConnection()` function to verify everything works

## 📊 Step 3: Google Sheets Integration

### 3.1 Add Status Columns to Your Sheet

Add these columns to your Google Sheet (if not already present):
- **API Status** - Shows if data was sent to API successfully
- **Submission ID** - The ID returned from the backend API

### 3.2 Field Mapping

The script automatically maps common form field names to database columns. If your form has different field names, update the `getFieldMapping()` function in the Apps Script.

**Common mappings:**
- "Name" / "Full Name" → `full_name`
- "Email" / "Email Address" → `email_address`
- "Course" / "Course Name" → `course_name`
- "Batch" / "Batch Code" → `batch_initials`
- "GPA" / "Score" → `gpa`
- "Attendance" → `attendance_percentage`

## 🚀 Step 4: Backend Deployment (Already Done)

Your backend is already deployed at: `https://certificate-automation-dmoe.onrender.com`

The updated APIs are now live and include:
- **Form submission**: `POST /api/forms/submit`
- **Certificate generation**: `POST /api/certificates/generate/:id`
- **Admin dashboard**: `GET /api/admin/dashboard`
- **Certificate verification**: `GET /api/certificates/verify/:refNo`

## 🎯 Step 5: Admin Dashboard Access

### 5.1 Access the Dashboard

Visit: `https://certificate-automation-dmoe.onrender.com/admin/admin-dashboard.html`

### 5.2 Dashboard Features

- **View all form submissions** with status (pending, generated, issued)
- **Approve/Generate certificates** for pending submissions
- **Batch generate** multiple certificates at once
- **View statistics** and recent submissions
- **Test API connectivity**

## ⚙️ Step 6: Certificate Generation Process

### Automatic Workflow:

1. **Student fills Google Form** → Data goes to Google Sheets
2. **Google Apps Script triggers** → Sends data to `/api/forms/submit`
3. **Backend stores data** → Status = "pending" in `form_submissions` table
4. **Admin reviews** → Uses dashboard to approve and generate certificates
5. **Certificate generated** → Creates PDF/IMG with QR code, Status = "generated"
6. **Verification available** → Certificate can be verified via QR code or manual entry

### Manual Generation:

1. Go to admin dashboard
2. Filter by "Pending" status
3. Click "Generate" for individual certificates
4. Or use "Generate All Pending" for batch processing

## 🔍 Step 7: Certificate Verification

### 7.1 QR Code Verification

Each certificate has a QR code that links to:
```
https://certificate-automation-dmoe.onrender.com/verify/{REFERENCE_NUMBER}
```

### 7.2 Manual Verification

Students/employers can verify certificates at:
```
https://certificate-automation-dmoe.onrender.com/
```

## 🔐 Step 8: Security & Environment Variables

Make sure these environment variables are set in Render:

```env
DATABASE_URL=postgresql://certificate_db_44nb_user:bjfK6mi1OXHXE0tYBw8YjtzrWOHX6EhM@dpg-d1p19f7fte5s73br93k0-a.oregon-postgres.render.com/certificate_db_44nb
DB_TYPE=postgresql
NODE_ENV=production
VERIFICATION_BASE_URL=https://certificate-automation-dmoe.onrender.com/verify/
```

## 🧪 Step 9: Testing the Complete Workflow

### 9.1 Test Form Submission

1. Fill out your Google Form: `https://forms.gle/UygoiVrfaKi3A3z59`
2. Check Google Sheets for "API Status" = "sent_to_api"
3. Check admin dashboard for new pending submission

### 9.2 Test Certificate Generation

1. Go to admin dashboard
2. Find the test submission
3. Click "Generate Certificate"
4. Verify certificate appears in "Generated" status

### 9.3 Test Verification

1. Use the generated reference number
2. Go to verification page
3. Enter reference number to verify certificate

## 📋 Troubleshooting

### Common Issues:

1. **Form data not reaching API**:
   - Check Apps Script logs
   - Verify API_BASE_URL in script
   - Check form trigger is set up correctly

2. **Certificate generation fails**:
   - Check database connection
   - Verify certificate templates exist
   - Check file permissions for generated certificates

3. **Admin dashboard not loading**:
   - Wait 2-3 minutes for deployment
   - Check CORS settings
   - Clear browser cache

### Debug Tools:

- **Apps Script Logs**: View → Logs in Apps Script editor
- **API Logs**: Check Render deployment logs
- **Admin Dashboard**: Use "Test API" button
- **Database**: Connect directly to check data

## 🎉 Success Indicators

✅ Google Form submissions appear in admin dashboard
✅ Certificates can be generated with unique reference numbers  
✅ QR codes work and link to verification page
✅ Certificate verification shows valid status
✅ All API endpoints respond correctly

## 📞 Support

If you encounter issues:

1. Check the logs in Apps Script editor
2. Use the admin dashboard "Test API" feature
3. Verify database connectivity
4. Check that all environment variables are set correctly

---

**Your certificate automation system is now fully configured and ready to handle form submissions automatically!** 🚀
