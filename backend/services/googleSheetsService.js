const { google } = require('googleapis');
const { getGoogleCredentials } = require('./googleAuth');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const credentials = getGoogleCredentials();
      
      // Create JWT auth with broader scopes
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/drive.readonly'
        ]
      );

      // Initialize the Sheets API
      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;
      
      console.log('✅ Google Sheets service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async fetchFormData(spreadsheetId = '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU', range = 'Form Responses 1!A:Z') {
    try {
      await this.initialize();

      console.log(`🔄 Fetching data from Google Sheet: ${spreadsheetId}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('⚠️ No data found in the sheet');
        return [];
      }

      // First row contains headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      console.log(`📊 Found ${dataRows.length} data rows with ${headers.length} columns`);
      console.log('📋 Headers:', headers);

      // Convert rows to objects using headers as keys
      const formData = dataRows.map((row, index) => {
        const rowData = {};
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });
        
        // Add metadata
        rowData.row_number = index + 2; // +2 because of header row and 0-based index
        rowData.form_source = 'google_forms';
        rowData.timestamp = rowData['Timestamp'] || new Date().toISOString();
        
        return rowData;
      });

      console.log(`✅ Successfully processed ${formData.length} form submissions`);
      return formData;

    } catch (error) {
      console.error('❌ Error fetching Google Sheets data:', error.message);
      console.error('📝 Error details:', {
        status: error.status || error.code,
        message: error.message,
        spreadsheetId,
        range
      });
      
      if (error.status === 403 || error.code === 403) {
        console.error('🔐 PERMISSION DENIED - Service account lacks access to the Google Sheet');
        console.error('📝 Solution: Share the Google Sheet with: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com');
        console.error('📝 Required permission: At least "Viewer" access');
      } else if (error.status === 404 || error.code === 404) {
        console.error('📄 SHEET NOT FOUND - Check the spreadsheet ID');
        console.error('📝 Current ID:', spreadsheetId);
      } else if (error.message.includes('The caller does not have permission')) {
        console.error('📝 Make sure the service account has access to the Google Sheet');
        console.error('📝 Share the sheet with: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com');
      }
      
      throw error;
    }
  }

  // Helper method to map Google Forms field names to database schema
  normalizeFormData(formData) {
    return formData.map((row, index) => {
      console.log(`🔍 Row ${index + 1} all keys:`, Object.keys(row));
      console.log(`🔍 Row ${index + 1} sample values:`, {
        'FULL NAME': row['FULL NAME'],
        'Email Address': row['Email Address'], 
        'Course/Domain': row['Course/Domain'],
        'Batch': row['Batch']
      });
      
      const normalized = {
        timestamp: row['Timestamp'] || row.timestamp,
        email_address: row['Email Address'] || row['Email address'] || row['Email'] || row.email_address,
        title: row['Title'] || row.title,
        full_name: row['FULL NAME'] || row['Full Name'] || row['Name'] || row.full_name,
        phone: row['Phone Number '] || row['Phone Number'] || row['Phone'] || row['Mobile'] || row.phone,
        date_of_birth: this.formatDate(row['DATE OF BIRTH'] || row['Date of Birth'] || row['DOB'] || row.date_of_birth),
        gender: row['GENDER'] || row['Gender'] || row.gender,
        course_name: row['Course/Domain'] || row['Course Name'] || row['Course'] || row.course_name,
        batch_initials: row['Batch'] || row['Batch Initials'] || row.batch_initials,
        start_date: this.formatDate(row['STRT DATE'] || row['Start Date'] || row.start_date),
        end_date: this.formatDate(row['END DATE'] || row['End Date'] || row.end_date),
        gpa: row['GPA'] || row['Score'] || row.gpa,
        certificate_type: row['Certificate Type'] || row.certificate_type || 'student',
        qualification: row['Qualification'] || row.qualification,
        organization: row['Organization'] || row['Company'] || row.organization,
        form_source: 'google_forms',
        raw_form_data: row
      };

      console.log('✅ Normalized data:', {
        full_name: normalized.full_name,
        email_address: normalized.email_address,
        course_name: normalized.course_name,
        batch_initials: normalized.batch_initials,
        date_of_birth: normalized.date_of_birth
      });

      // Remove empty values but keep null for debugging
      Object.keys(normalized).forEach(key => {
        if (normalized[key] === '' || normalized[key] === undefined) {
          delete normalized[key];
        }
      });

      return normalized;
    });
  }

  // Helper method to format dates to PostgreSQL format (YYYY-MM-DD)
  formatDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log(`📅 Date converted: ${dateStr} → ${formatted}`);
          return formatted;
        }
      }
      
      // Handle other formats or return as-is if already in correct format
      return dateStr;
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return null;
    }
  }
}

module.exports = new GoogleSheetsService();
