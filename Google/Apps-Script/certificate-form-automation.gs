/**
 * Google Apps Script for Certificate Automation Form Integration
 * This script automatically sends Google Form responses to your backend API
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Update the API_BASE_URL to your deployed backend URL
 * 5. Set up a trigger for form submission (onFormSubmit)
 * 6. Link this script to your Google Form
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://certificate-automation-dmoe.onrender.com/api',
  FORM_SUBMIT_ENDPOINT: '/forms/submit',
  SHEET_ID: '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU', // Your Google Sheet ID
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // milliseconds
};

/**
 * Main function that handles form submission
 * This function is triggered when a form is submitted
 */
function onFormSubmit(e) {
  try {
    console.log('📝 Form submission triggered');
    
    // Get form response data
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Convert form responses to data object
    const formData = processFormResponses(itemResponses);
    
    // Add metadata
    formData.timestamp = formResponse.getTimestamp();
    formData.response_id = formResponse.getId();
    formData.form_id = formResponse.getForm().getId();
    
    console.log('📊 Processed form data:', formData);
    
    // Send to backend API
    const result = sendToAPI(formData);
    
    if (result.success) {
      console.log('✅ Successfully sent to API:', result.data);
      
      // Optionally update the Google Sheet with submission status
      updateSheetWithStatus(formData, 'sent_to_api', result.data.submissionId);
    } else {
      console.error('❌ Failed to send to API:', result.error);
      
      // Log error to sheet
      updateSheetWithStatus(formData, 'api_error', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error in onFormSubmit:', error);
    
    // Log critical error
    logError('onFormSubmit', error, e);
  }
}

/**
 * Process form responses into a structured data object
 */
function processFormResponses(itemResponses) {
  const data = {};
  
  itemResponses.forEach(itemResponse => {
    const question = itemResponse.getItem().getTitle();
    const answer = itemResponse.getResponse();
    
    // Map form questions to database fields
    const fieldMapping = getFieldMapping();
    const dbField = fieldMapping[question] || sanitizeFieldName(question);
    
    data[dbField] = answer;
  });
  
  return data;
}

/**
 * Map form question titles to database field names
 * Update this mapping based on your actual form questions
 */
function getFieldMapping() {
  return {
    // Personal Information
    'Name': 'full_name',
    'Full Name': 'full_name',
    'Student Name': 'full_name',
    'Participant Name': 'full_name',
    
    'Email': 'email_address',
    'Email Address': 'email_address',
    'E-mail': 'email_address',
    
    'Phone': 'phone',
    'Mobile Number': 'phone',
    'Contact Number': 'phone',
    'Phone Number': 'phone',
    
    'Title': 'title',
    'Salutation': 'title',
    'Mr/Ms': 'title',
    
    'Date of Birth': 'date_of_birth',
    'DOB': 'date_of_birth',
    'Birth Date': 'date_of_birth',
    
    'Gender': 'gender',
    'Sex': 'gender',
    
    // Address Information
    'Address': 'address_line1',
    'Address Line 1': 'address_line1',
    'Street Address': 'address_line1',
    
    'City': 'city',
    'State': 'state',
    'Province': 'state',
    'Country': 'country',
    'Postal Code': 'postal_code',
    'ZIP Code': 'postal_code',
    'Pin Code': 'postal_code',
    
    // Educational/Professional
    'Qualification': 'qualification',
    'Education': 'qualification',
    'Degree': 'qualification',
    
    'Institution': 'institution',
    'College': 'institution',
    'University': 'institution',
    'School': 'institution',
    
    'Organization': 'organization',
    'Company': 'organization',
    'Employer': 'organization',
    
    'Position': 'position',
    'Job Title': 'position',
    'Designation': 'position',
    
    'Experience': 'experience_years',
    'Years of Experience': 'experience_years',
    'Work Experience': 'experience_years',
    
    // Course Information
    'Course': 'course_name',
    'Course Name': 'course_name',
    'Training Program': 'course_name',
    'Program': 'course_name',
    
    'Batch': 'batch_initials',
    'Batch Code': 'batch_initials',
    'Batch Number': 'batch_initials',
    
    'Training Type': 'training_type',
    'Course Type': 'training_type',
    'Program Type': 'training_type',
    
    'Training Mode': 'training_mode',
    'Mode of Training': 'training_mode',
    
    // Dates
    'Start Date': 'start_date',
    'Course Start Date': 'start_date',
    'Training Start Date': 'training_start_date',
    
    'End Date': 'end_date',
    'Course End Date': 'end_date',
    'Training End Date': 'training_end_date',
    
    // Performance Metrics
    'GPA': 'gpa',
    'CGPA': 'gpa',
    'Grade Point Average': 'gpa',
    
    'Attendance': 'attendance_percentage',
    'Attendance %': 'attendance_percentage',
    'Attendance Percentage': 'attendance_percentage',
    
    'Assessment Score': 'assessment_score',
    'Test Score': 'assessment_score',
    'Final Score': 'assessment_score',
    'Score': 'assessment_score',
    
    'Grade': 'grade',
    'Final Grade': 'grade',
    
    // Certificate Type
    'Certificate Type': 'certificate_type',
    'Type': 'certificate_type',
    'Category': 'certificate_type'
  };
}

/**
 * Sanitize field names for database compatibility
 */
function sanitizeFieldName(fieldName) {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Send form data to backend API
 */
function sendToAPI(formData) {
  const url = CONFIG.API_BASE_URL + CONFIG.FORM_SUBMIT_ENDPOINT;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(formData)
  };
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`🌐 Attempt ${attempt}: Sending to ${url}`);
      
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      console.log(`📡 Response Code: ${responseCode}`);
      console.log(`📡 Response Body: ${responseText}`);
      
      if (responseCode >= 200 && responseCode < 300) {
        const responseData = JSON.parse(responseText);
        return {
          success: true,
          data: responseData
        };
      } else {
        console.error(`❌ API Error ${responseCode}: ${responseText}`);
        
        if (attempt === CONFIG.MAX_RETRIES) {
          return {
            success: false,
            error: `API Error ${responseCode}: ${responseText}`
          };
        }
      }
      
    } catch (error) {
      console.error(`❌ Network Error (Attempt ${attempt}):`, error);
      
      if (attempt === CONFIG.MAX_RETRIES) {
        return {
          success: false,
          error: `Network Error: ${error.message}`
        };
      }
    }
    
    // Wait before retrying
    if (attempt < CONFIG.MAX_RETRIES) {
      Utilities.sleep(CONFIG.RETRY_DELAY * attempt);
    }
  }
  
  return {
    success: false,
    error: 'Max retries exceeded'
  };
}

/**
 * Update Google Sheet with submission status
 */
function updateSheetWithStatus(formData, status, submissionId = null) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getActiveSheet();
    
    // Find the row with this form submission (by timestamp or email)
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find relevant columns
    const timestampCol = headers.indexOf('Timestamp') + 1;
    const emailCol = headers.indexOf('Email Address') || headers.indexOf('Email') + 1;
    const statusCol = headers.indexOf('API Status') + 1 || sheet.getLastColumn() + 1;
    const submissionIdCol = headers.indexOf('Submission ID') + 1 || sheet.getLastColumn() + 2;
    
    // Add headers if they don't exist
    if (headers.indexOf('API Status') === -1) {
      sheet.getRange(1, statusCol).setValue('API Status');
    }
    if (headers.indexOf('Submission ID') === -1) {
      sheet.getRange(1, submissionIdCol).setValue('Submission ID');
    }
    
    // Find the matching row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowTimestamp = row[timestampCol - 1];
      const rowEmail = row[emailCol - 1];
      
      // Match by timestamp and email
      if (rowTimestamp.toString() === formData.timestamp.toString() && 
          rowEmail === formData.email_address) {
        
        // Update status
        sheet.getRange(i + 1, statusCol).setValue(status);
        
        if (submissionId) {
          sheet.getRange(i + 1, submissionIdCol).setValue(submissionId);
        }
        
        console.log(`📊 Updated sheet row ${i + 1} with status: ${status}`);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating sheet:', error);
  }
}

/**
 * Log errors to a separate sheet or document
 */
function logError(functionName, error, eventData = null) {
  try {
    const errorLog = {
      timestamp: new Date(),
      function: functionName,
      error: error.toString(),
      stack: error.stack,
      eventData: eventData ? JSON.stringify(eventData) : null
    };
    
    console.error('🚨 Error Log:', errorLog);
    
    // Optionally save to a separate error log sheet
    // saveErrorToSheet(errorLog);
    
  } catch (logError) {
    console.error('❌ Error in error logging:', logError);
  }
}

/**
 * Manual test function - call this to test the API connection
 */
function testAPIConnection() {
  const testData = {
    full_name: 'Test User',
    email_address: 'test@example.com',
    course_name: 'Test Course',
    certificate_type: 'student',
    timestamp: new Date()
  };
  
  console.log('🧪 Testing API connection...');
  const result = sendToAPI(testData);
  
  if (result.success) {
    console.log('✅ API connection test successful!');
    return true;
  } else {
    console.log('❌ API connection test failed:', result.error);
    return false;
  }
}

/**
 * Setup function - call this once to configure the script
 */
function setupScript() {
  console.log('⚙️ Setting up Google Apps Script...');
  
  // Test API connection
  const apiWorking = testAPIConnection();
  
  if (apiWorking) {
    console.log('✅ Setup complete! The script is ready to handle form submissions.');
    console.log('📝 Make sure to create a trigger for onFormSubmit function.');
    console.log('📊 Form submissions will be automatically sent to your backend API.');
  } else {
    console.log('❌ Setup failed. Please check your API configuration.');
  }
  
  return apiWorking;
}

/**
 * Create a trigger for form submissions
 * Run this function once to set up automatic form processing
 */
function createFormTrigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger for the form
    const form = FormApp.openById('1FAIpQLSfI19mehpVH35xAp5TtnAeFjbow40rN8Fo0-1JSchnJiglgSg'); // Extract from your form URL
    ScriptApp.newTrigger('onFormSubmit')
      .form(form)
      .onFormSubmit()
      .create();
    
    console.log('✅ Form trigger created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating form trigger:', error);
    console.log('💡 You may need to create the trigger manually in the Apps Script editor.');
  }
}
