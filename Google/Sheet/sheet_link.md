# Google Sheets Integration - Certificate Automation System

## 📊 Google Sheets Configuration

### Primary Spreadsheet
**URL**: https://docs.google.com/spreadsheets/d/1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU/edit?usp=sharing

### Sheet Structure
- **Sheet 1**: Student Certificate Applications
- **Sheet 2**: Trainer Certificate Applications  
- **Sheet 3**: Trainee Certificate Applications

### Data Processing
- **Collection**: Form responses stored automatically
- **Processing**: Google Apps Script processes new entries
- **Transfer**: Data sent to backend API for database storage
- **Validation**: Backend validates and structures data

## 🔐 API Configuration

### Service Account
- **File**: `Sheet-API.JSON`
- **Project ID**: opportune-sylph-458214-b8
- **Client Email**: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com

### Permissions
- **Google Sheets API**: Read/Write access
- **Google Drive API**: File access permissions
- **Scope**: https://www.googleapis.com/auth/spreadsheets

## 🔄 Workflow Integration

### Form to Sheet
1. User submits Google Form
2. Response automatically added to sheet
3. Google Apps Script triggered on new row

### Sheet to Database  
1. Apps Script processes new data
2. Data formatted and validated
3. Webhook POST to backend API
4. Backend stores in PostgreSQL/MySQL

### Data Synchronization
- **Real-time**: Form submissions processed immediately  
- **Batch Processing**: Periodic sync for reliability
- **Error Handling**: Failed transfers logged and retried

## 📋 Data Fields

### Student Certificates
- Full Name, Email, Course, Batch, Start Date, End Date, GPA

### Trainer Certificates  
- Full Name, Email, Employee ID, Qualification, Specialization, Training Hours

### Trainee Certificates
- Full Name, Email, Phone, Organization, Position, Training Duration

## 🛠️ Maintenance

### Regular Tasks
- Monitor sheet data quality
- Verify API connectivity
- Check Apps Script execution logs
- Validate data transfer success

### Troubleshooting
- **Script Failures**: Check Apps Script logs
- **API Errors**: Verify service account permissions
- **Data Issues**: Validate form field mappings

---
*SRS Reference: Section 1.2 - Google Sheets Integration*  
*Last Updated: July 12, 2025*
