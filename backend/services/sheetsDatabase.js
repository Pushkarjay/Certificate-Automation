
const { google } = require('googleapis');
const { getGoogleCredentials } = require('./googleAuth');

/**
 * Google Sheets Database Service
 * This service replaces the traditional database with Google Sheets as the data storage layer
 * Supports three separate sheets for Trainers, Trainees (Interns), and Students
 */
class SheetsDatabase {
  /**
   * Map possible response columns to normalized field names
   */
  static getFieldMapping() {
    // Map normalized field names to all possible response column names (case-insensitive)
    // This covers all three sheet types and all possible Google Form response columns
    return {
      timestamp: ['Timestamp', 'timestamp'],
      full_name: ['FULL NAME', 'Full Name', 'full_name'],
      email_address: ['Email Address', 'Email address', 'email_address'],
      title: ['Title', 'title'],
      phone: ['Phone Number', 'Phone Number ', 'phone'],
      date_of_birth: ['DATE OF BIRTH', 'Date of Birth', 'date_of_birth'],
      gender: ['GENDER', 'Gender', 'gender'],
      course_name: ['Course/Domain', 'Course Name', 'course_name'],
      batch_initials: ['Batch', 'batch_initials'],
      gpa: ['GPA', 'gpa'],
      certificate_type: ['Choose Your Role', 'certificate_type'],
      batch_name: ['Batch Name', 'batch_name'],
      course_domain: ['Course Domain', 'course_domain'],
      status: ['Status', 'status'],
      certificate_id: ['Certificate ID', 'certificate_id'],
      certificate_url: ['Certificate URL', 'certificate_url'],
      verification_code: ['Verification Code', 'verification_code'],
      issued_date: ['Issued Date', 'issued_date'],
      qr_code: ['QR Code', 'qr_code'],
      // Add all other normalized fields and their possible response columns as needed
    };
  }

  /**
   * Normalize a row from Google Sheets to use only normalized field names
   * @param {object} rowObj - The row object with all columns
   * @returns {object} Normalized row
   */
  static normalizeRow(rowObj) {
    const mapping = this.getFieldMapping();
    const normalized = {};
    // For each normalized field, find the first non-empty value from possible columns (case-insensitive)
    for (const [norm, possibleCols] of Object.entries(mapping)) {
      for (const col of possibleCols) {
        // Case-insensitive match
        const foundKey = Object.keys(rowObj).find(k => k.trim().toLowerCase() === col.trim().toLowerCase());
        if (foundKey && rowObj[foundKey] !== undefined && rowObj[foundKey] !== '') {
          normalized[norm] = rowObj[foundKey];
          break;
        }
      }
    }
    // Also copy all normalized fields that are already present
    for (const key of Object.keys(rowObj)) {
      if (normalized[key] === undefined && mapping[key]) {
        normalized[key] = rowObj[key];
      }
    }
    // Add _originalData for debugging
    normalized._originalData = rowObj;
    return normalized;
  }

  // ...existing code...
  static transformRowData(raw) {
    // Use normalizeRow for robust normalization
    const normalized = this.normalizeRow(raw);
    if (!normalized.status) normalized.status = 'pending';
    return normalized;
  }
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.initialized = false;
    
    // Sheet IDs extracted from the provided URLs
    this.sheetIds = {
      trainer: '1mPZWEFwLdqi9rKYzrxQtzG3vDHo52DmrnwGTkG0jHsw',
      trainee: '18GpdPOxHA4x1Y1VBefpBKbQzxR5NaVPWFra3EEbP9dQ', 
      student: '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU'
    };
    
    // Default sheet structure - these columns will be auto-created if they don't exist
    this.defaultColumns = [
      'timestamp',
      'full_name',
      'email_address',
      'title',
      'phone',
      'date_of_birth',
      'gender',
      'address_line1',
      'address_line2', 
      'city',
      'state',
      'country',
      'postal_code',
      'qualification',
      'institution',
      'specialization',
      'experience_years',
      'organization',
      'position',
      'employee_id',
      'course_name',
      'course_domain',
      'batch_initials',
      'batch_name',
      'training_type',
      'training_mode',
      'start_date',
      'end_date',
      'training_start_date',
      'training_end_date',
      'attendance_percentage',
      'assessment_score',
      'gpa',
      'grade',
      'performance_rating',
      'training_hours',
      'training_duration_hours',
      'certificate_type',
      'status',
      'certificate_id',
      'certificate_url',
      'certificate_pdf_data',
      'qr_code',
      'issued_date',
      'valid_until',
      'verification_code',
      'form_source',
      'response_id',
      'additional_data'
    ];
  }

  /**
   * Initialize the Google Sheets service with proper authentication
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing Google Sheets Database Service...');
      
      const credentials = getGoogleCredentials();
      
      // Create JWT auth with full spreadsheets access
      this.auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      );

      // Test authentication
      await this.auth.authorize();
      console.log('✅ Google authentication successful');

      // Initialize Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;

      // Validate and setup sheet structures
      await this.validateAndSetupSheets();
      
      console.log('✅ Google Sheets Database service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets Database:', error.message);
      throw error;
    }
  }

  /**
   * Validate and setup the structure of all sheets
   */
  async validateAndSetupSheets() {
    for (const [type, sheetId] of Object.entries(this.sheetIds)) {
      try {
        console.log(`🔄 Validating ${type} sheet structure...`);
        await this.ensureSheetStructure(sheetId, type);
        console.log(`✅ ${type} sheet structure validated`);
      } catch (error) {
        console.error(`❌ Error setting up ${type} sheet:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Ensure the sheet has the proper column structure
   */
  async ensureSheetStructure(sheetId, sheetType) {
    try {
      // Get current sheet structure
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A1:ZZ1', // Get first row (headers)
      });

      const currentHeaders = response.data.values ? response.data.values[0] || [] : [];
      
      // Check if we need to add missing columns
      const missingColumns = this.defaultColumns.filter(col => !currentHeaders.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`📝 Adding missing columns to ${sheetType} sheet:`, missingColumns);
        
        // Add missing columns to the end
        const newHeaders = [...currentHeaders, ...missingColumns];
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'A1',
          valueInputOption: 'RAW',
          resource: {
            values: [newHeaders]
          }
        });
        
        console.log(`✅ Updated ${sheetType} sheet headers`);
      }
      
      return currentHeaders;
    } catch (error) {
      console.error(`❌ Error ensuring sheet structure for ${sheetType}:`, error.message);
      throw error;
    }
  }

  /**
   * Insert a new form submission into the appropriate sheet
   */
  async insertFormSubmission(data, certificateType) {
    await this.initialize();
    
    try {
      const sheetId = this.sheetIds[certificateType];
      if (!sheetId) {
        throw new Error(`Invalid certificate type: ${certificateType}`);
      }

      console.log(`📝 Inserting ${certificateType} form submission:`, data.full_name);

      // Get current headers to map data correctly
      const headersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A1:ZZ1'
      });

      const headers = headersResponse.data.values ? headersResponse.data.values[0] : this.defaultColumns;
      
      // Prepare row data based on headers
      const rowData = headers.map(header => {
        if (header === 'timestamp' && !data[header]) {
          return new Date().toISOString();
        }
        if (header === 'certificate_type' && !data[header]) {
          return certificateType;
        }
        if (header === 'status' && !data[header]) {
          return 'pending';
        }
        return data[header] || '';
      });

      // Append the new row
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowData]
        }
      });

      // Extract row number from response
      const updatedRange = response.data.updates.updatedRange;
      const rowNumber = updatedRange.match(/(\d+)$/)[1];
      
      console.log(`✅ Form submission inserted at row ${rowNumber}`);
      
      return {
        id: `${certificateType}_${rowNumber}`,
        rowNumber: parseInt(rowNumber),
        sheetId: sheetId,
        certificateType: certificateType
      };

    } catch (error) {
      console.error('❌ Error inserting form submission:', error.message);
      throw error;
    }
  }

  /**
   * Get all submissions with pagination and filtering
   */
  async getSubmissions(options = {}) {
    await this.initialize();
    
    try {
      const {
        certificateType = 'student',
        page = 1,
        limit = 20,
        status = null,
        search = null
      } = options;

      const sheetId = this.sheetIds[certificateType];
      if (!sheetId) {
        throw new Error(`Invalid certificate type: ${certificateType}`);
      }

      // Get all data from the sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:ZZ'
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return { data: [], total: 0, page, limit };
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Convert rows to objects and normalize fields
      let submissions = dataRows.map((row, index) => {
        const raw = {};
        headers.forEach((header, colIndex) => {
          raw[header] = row[colIndex] || '';
        });
        raw._rowNumber = index + 2;
        raw._id = `${certificateType}_${raw._rowNumber}`;
        // Robust normalization
        const normalized = this.constructor.transformRowData(raw);
        normalized._rowNumber = raw._rowNumber;
        normalized._id = raw._id;
        return normalized;
      });

      // Apply filters
      if (status) {
        submissions = submissions.filter(sub => sub.status === status);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        submissions = submissions.filter(sub => 
          sub.full_name?.toLowerCase().includes(searchLower) ||
          sub.email_address?.toLowerCase().includes(searchLower) ||
          sub.course_name?.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const total = submissions.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = submissions.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('❌ Error getting submissions:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific submission by ID
   */
  async getSubmissionById(id) {
    await this.initialize();
    
    try {
      const [certificateType, rowNumber] = id.split('_');
      const sheetId = this.sheetIds[certificateType];
      
      if (!sheetId) {
        throw new Error(`Invalid certificate type: ${certificateType}`);
      }

      // Get headers
      const headersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A1:ZZ1'
      });

      const headers = headersResponse.data.values ? headersResponse.data.values[0] : [];

      // Get specific row
      const rowResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `A${rowNumber}:ZZ${rowNumber}`
      });

      const rowData = rowResponse.data.values ? rowResponse.data.values[0] : [];
      if (!rowData || rowData.length === 0) {
        return null;
      }
      // Convert row to object and normalize
      const raw = {};
      headers.forEach((header, colIndex) => {
        raw[header] = rowData[colIndex] || '';
      });
      raw._rowNumber = rowNumber;
      raw._id = id;
      const normalized = this.constructor.transformRowData(raw);
      normalized._rowNumber = raw._rowNumber;
      normalized._id = raw._id;
      return normalized;
      submission._sheetId = sheetId;
      submission._certificateType = certificateType;

      return submission;

    } catch (error) {
      console.error('❌ Error getting submission by ID:', error.message);
      throw error;
    }
  }

  /**
   * Update a submission by ID
   */
  async updateSubmission(id, updateData) {
    await this.initialize();
    
    try {
      const [certificateType, rowNumber] = id.split('_');
      const sheetId = this.sheetIds[certificateType];
      
      if (!sheetId) {
        throw new Error(`Invalid certificate type: ${certificateType}`);
      }

      // Get current headers
      const headersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A1:ZZ1'
      });

      const headers = headersResponse.data.values ? headersResponse.data.values[0] : [];

      // Get current row data
      const currentSubmission = await this.getSubmissionById(id);
      if (!currentSubmission) {
        throw new Error('Submission not found');
      }

      // Merge update data with current data
      const updatedSubmission = { ...currentSubmission, ...updateData };

      // Prepare row data
      const rowData = headers.map(header => updatedSubmission[header] || '');

      // Update the row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `A${rowNumber}:ZZ${rowNumber}`, // Use ZZ to cover all columns
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });

      console.log(`✅ Updated submission ${id}`);
      return updatedSubmission;

    } catch (error) {
      console.error('❌ Error updating submission:', error.message);
      throw error;
    }
  }

  /**
   * Store certificate PDF data in the sheet
   */
  async storeCertificatePDF(id, pdfData, certificateInfo = {}) {
    await this.initialize();
    
    try {
      const updateData = {
        certificate_pdf_data: pdfData, // Base64 encoded PDF
        certificate_id: certificateInfo.certificateId || '',
        certificate_url: certificateInfo.certificateUrl || '',
        qr_code: certificateInfo.qrCode || '',
        issued_date: new Date().toISOString(),
        status: 'issued',
        verification_code: certificateInfo.verificationCode || ''
      };

      return await this.updateSubmission(id, updateData);

    } catch (error) {
      console.error('❌ Error storing certificate PDF:', error.message);
      throw error;
    }
  }

  /**
   * Search for certificates by verification code
   */
  async findByVerificationCode(verificationCode) {
    await this.initialize();
    
    try {
      // Search across all sheet types
      for (const [certificateType, sheetId] of Object.entries(this.sheetIds)) {
        const submissions = await this.getSubmissions({ 
          certificateType, 
          limit: 1000 // Get all records
        });
        
        const found = submissions.data.find(sub => sub.verification_code === verificationCode);
        if (found) {
          return found;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error finding by verification code:', error.message);
      throw error;
    }
  }

  /**
   * Get sheet statistics
   */
  async getStats() {
    await this.initialize();
    
    try {
      const stats = {};
      
      for (const [certificateType, sheetId] of Object.entries(this.sheetIds)) {
        const submissions = await this.getSubmissions({ 
          certificateType, 
          limit: 1000 
        });
        
        stats[certificateType] = {
          total: submissions.total,
          pending: submissions.data.filter(s => s.status === 'pending').length,
          issued: submissions.data.filter(s => s.status === 'issued').length,
          revoked: submissions.data.filter(s => s.status === 'revoked').length
        };
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting stats:', error.message);
      throw error;
    }
  }

  /**
   * Test connection to all sheets
   */
  async testConnection() {
    try {
      await this.initialize();
      
      for (const [type, sheetId] of Object.entries(this.sheetIds)) {
        await this.sheets.spreadsheets.get({
          spreadsheetId: sheetId
        });
        console.log(`✅ ${type} sheet connection successful`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Sheet connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new SheetsDatabase();
