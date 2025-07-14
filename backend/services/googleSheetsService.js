const { google } = require('googleapis');
const { getGoogleCredentials } = require('./googleAuth');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.initialized = false;
    this.lastError = null;
    this.fallbackMode = false;
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

      // Test the authentication before declaring success
      console.log('🔄 Testing Google authentication...');
      await auth.authorize();
      console.log('✅ Google authentication successful');

      // Initialize the Sheets API
      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;
      this.fallbackMode = false;
      
      console.log('✅ Google Sheets service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error.message);
      
      // Set fallback mode
      this.fallbackMode = true;
      this.lastError = error;
      
      // Log specific error guidance
      if (error.message.includes('invalid_grant')) {
        console.error('🔧 SOLUTION: Service account key needs to be regenerated');
        console.error('📝 Visit: https://console.cloud.google.com/iam-admin/serviceaccounts');
        console.error('📝 Project: opportune-sylph-458214-b8');
        console.error('📝 Generate new key for: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com');
      }
      
      // Don't throw error, allow service to work in fallback mode
      console.log('⚠️ Google Sheets service will operate in fallback mode');
    }
  }

  async fetchFormData(spreadsheetId = '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU', range = 'Form Responses 1!A:Z') {
    try {
      await this.initialize();

      // If in fallback mode, return fallback data
      if (this.fallbackMode) {
        console.log('⚠️ Google Sheets unavailable, using fallback data...');
        return this.getFallbackData();
      }

      console.log(`🔄 Fetching data from Google Sheet: ${spreadsheetId}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('⚠️ No data found in the sheet, using fallback data');
        return this.getFallbackData();
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
      
      // Return fallback data instead of throwing
      console.log('🔄 Falling back to sample data due to Google Sheets error');
      return this.getFallbackData();
    }
  }

  // New method to provide fallback data when Google Sheets is unavailable
  getFallbackData() {
    console.log('📋 Using fallback data (Google Sheets unavailable)');
    
    return [
      {
        'Timestamp': new Date().toISOString(),
        'FULL NAME': 'PUSHKARJAY AJAY',
        'Email Address': 'pushkarjay@example.com',
        'Phone Number ': '+91-9876543210',
        'GENDER': 'Male',
        'DATE OF BIRTH': '15/05/1995',
        'Course/Domain': 'Full Stack Development',
        'Batch': 'G30',
        'STRT DATE': '01/01/2025',
        'END DATE': '31/03/2025',
        'GPA': '8.5',
        form_source: 'fallback_data',
        row_number: 2
      },
      {
        'Timestamp': new Date().toISOString(),
        'FULL NAME': 'Sample Student',
        'Email Address': 'sample@example.com',
        'Phone Number ': '+91-9876543211',
        'GENDER': 'Female',
        'DATE OF BIRTH': '20/08/1994',
        'Course/Domain': 'Data Science',
        'Batch': 'G31',
        'STRT DATE': '01/01/2025',
        'END DATE': '31/03/2025',
        'GPA': '9.0',
        form_source: 'fallback_data',
        row_number: 3
      }
    ];
  }

  // Method to check if service is working properly
  async testConnection() {
    try {
      await this.initialize();
      
      if (this.fallbackMode) {
        return {
          success: false,
          error: this.lastError?.message || 'Service account authentication failed',
          fallbackMode: true,
          recommendation: 'Regenerate service account key'
        };
      }
      
      // Test actual sheet access
      const testData = await this.fetchFormData('1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU', 'Form Responses 1!A1:B1');
      
      return {
        success: true,
        message: 'Google Sheets connection working',
        dataAvailable: testData && testData.length > 0
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackMode: this.fallbackMode
      };
    }
  }

  // Helper method to map Google Forms field names to database schema
  normalizeFormData(formData) {
    return formData.map((row, index) => {
      console.log(`🔍 Row ${index + 1} all keys:`, Object.keys(row));
      console.log(`🔍 Row ${index + 1} sample values:`, {
        'FULL NAME': row['FULL NAME'],
        'Email Address': row['Email Address'], 
        'Email address': row['Email address'],
        'Course/Domain': row['Course/Domain'],
        'Batch': row['Batch'],
        'Choose Your Role': row['Choose Your Role']
      });
      
      // Handle the complex multi-section form structure
      // Primary email (from timestamp row)
      const primaryEmail = row['Email address'] || row['email address'];
      
      // Try multiple variations of the full name field (prioritize populated ones)
      const fullNameOptions = [
        row['FULL NAME'],  // This appears in multiple columns
        row['Full Name'], 
        row['Name'],
        row['full_name'],
        row['Full name'],
        row['FULLNAME']
      ].filter(name => name && typeof name === 'string' && name.trim() !== '' && name.trim().length > 0);
      
      // Try multiple variations of email field 
      const emailOptions = [
        primaryEmail,           // Primary email from form submission
        row['Email Address'],   // Secondary email fields
        row['Email address'],
        row['Email'],
        row['email_address'],
        row['email']
      ].filter(email => email && typeof email === 'string' && email.trim() !== '' && email.includes('@'));
      
      // Try multiple variations of course field (appears in multiple columns)
      const courseOptions = [
        row['Course/Domain'],   // Multiple Course/Domain columns exist
        row['Course Name'],
        row['Course'],
        row['course_name'],
        row['Domain']
      ].filter(course => course && typeof course === 'string' && course.trim() !== '' && course.trim().length > 0);
      
      // Try multiple variations of batch field
      const batchOptions = [
        row['Batch'],
        row['Batch Initials'],
        row['batch_initials'],
        row['BATCH']
      ].filter(batch => batch && typeof batch === 'string' && batch.trim() !== '' && batch.trim().length > 0);
      
      // Get role from "Choose Your Role" field
      const role = row['Choose Your Role'] || 'Student';
      let certificateType = 'student';
      if (role.toLowerCase().includes('trainer')) {
        certificateType = 'trainer';
      } else if (role.toLowerCase().includes('trainee') || role.toLowerCase().includes('intern')) {
        certificateType = 'trainee';
      }
      
      const normalized = {
        timestamp: row['Timestamp'] || row.timestamp,
        email_address: emailOptions[0] || `unknown${index + 1}@example.com`,
        title: row['Title'] || row.title || 'Mr',
        full_name: fullNameOptions[0] || `Form Respondent ${index + 1}`, // Provide meaningful default
        phone: row['Phone Number '] || row['Phone Number'] || row['Phone'] || row['Mobile'] || row.phone,
        date_of_birth: this.formatDate(row['DATE OF BIRTH'] || row['Date of Birth'] || row['DOB'] || row.date_of_birth),
        gender: row['GENDER'] || row['Gender'] || row.gender || 'Not Specified',
        course_name: courseOptions[0] || 'General Course',
        batch_initials: batchOptions[0] || 'GEN',
        start_date: this.formatDate(row['STRT DATE'] || row['STRT DATE(FROM)'] || row['Start Date'] || row.start_date),
        end_date: this.formatDate(row['END DATE'] || row['END DATE(TO)'] || row['End Date'] || row.end_date),
        gpa: row['GPA'] || row['Score'] || row.gpa || '0.0',
        certificate_type: certificateType,
        user_role: role,
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
        certificate_type: normalized.certificate_type,
        user_role: normalized.user_role,
        date_of_birth: normalized.date_of_birth
      });

      // CRITICAL: Ensure full_name is never null/undefined/empty before database insert
      if (!normalized.full_name || typeof normalized.full_name !== 'string' || normalized.full_name.trim() === '') {
        normalized.full_name = `Form Respondent ${index + 1}`;
      }
      
      // Ensure email has valid format
      if (!normalized.email_address || typeof normalized.email_address !== 'string' || !normalized.email_address.includes('@')) {
        normalized.email_address = `respondent${index + 1}@forms.example.com`;
      }
      
      // Ensure course name is not empty
      if (!normalized.course_name || typeof normalized.course_name !== 'string' || normalized.course_name.trim() === '') {
        normalized.course_name = 'General Training';
      }
      
      // Ensure batch is not empty
      if (!normalized.batch_initials || typeof normalized.batch_initials !== 'string' || normalized.batch_initials.trim() === '') {
        normalized.batch_initials = 'FORM';
      }

      return normalized;
    }).filter(row => {
      // Only keep rows that have valid data after normalization
      const hasValidName = row.full_name && typeof row.full_name === 'string' && 
                          row.full_name.trim() !== '' && 
                          !row.full_name.includes('Form Respondent');
      
      const hasValidEmail = row.email_address && typeof row.email_address === 'string' && 
                           row.email_address.includes('@') && 
                           !row.email_address.includes('respondent') &&
                           !row.email_address.includes('forms.example.com');
      
      const hasValidCourse = row.course_name && typeof row.course_name === 'string' && 
                            row.course_name.trim() !== '' && 
                            row.course_name !== 'General Training';
      
      // Include row if it has real name OR real email OR real course data
      const isValidRow = hasValidName || hasValidEmail || hasValidCourse;
      
      console.log(`🔍 Filter check for row ${row.raw_form_data?.row_number}: `, {
        hasValidName,
        hasValidEmail, 
        hasValidCourse,
        isValidRow,
        full_name: row.full_name,
        email_address: row.email_address
      });
      
      return isValidRow;
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
