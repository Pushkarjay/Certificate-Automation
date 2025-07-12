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
    
    // Check if event object exists (for manual testing vs actual form submission)
    if (!e || !e.response) {
      console.log('⚠️ No event object or response found. This function should be triggered by form submission.');
      console.log('💡 Use testAPIConnection() or setupScript() for manual testing.');
      return;
    }
    
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
  
  // Map role values to certificate types
  if (data.certificate_type) {
    const roleMapping = {
      'Student': 'student',
      'Intern (Trainee)': 'intern',
      'Trainer': 'trainer'
    };
    data.certificate_type = roleMapping[data.certificate_type] || data.certificate_type.toLowerCase();
  }
  
  // Set training mode based on certificate type (default assumption)
  if (!data.training_mode) {
    data.training_mode = 'online'; // Default for SURE Trust
  }
  
  return data;
}

/**
 * Map form question titles to database field names
 * Updated based on actual SURE Trust form structure
 */
function getFieldMapping() {
  return {
    // Section 1 - Role Selection
    'Email': 'email_address',
    'Choose Your Role': 'certificate_type',
    
    // Common Fields (across all sections)
    'Title': 'title',
    'Email Address': 'email_address',
    'FULL NAME': 'full_name',
    'GENDER': 'gender',
    'DATE OF BIRTH': 'date_of_birth',
    'Phone Number ': 'phone', // Note: has trailing space in form
    'Phone Number': 'phone',
    
    // Course Information
    'Course/Domain': 'course_name',
    
    // Section 2 - Trainer specific (no additional fields beyond common)
    
    // Section 3 - Intern (Trainee) specific
    'Batch': 'batch_initials',
    'STRT DATE': 'start_date',
    'END DATE': 'end_date',
    'GPA': 'gpa',
    
    // Section 4 - Student specific
    'STRT DATE(FROM)': 'start_date',
    'END DATE(TO)': 'end_date',
    
    // Alternative field names (for backward compatibility)
    'Start Date': 'start_date',
    'End Date': 'end_date',
    'Full Name': 'full_name',
    'Name': 'full_name',
    'Gender': 'gender',
    'Date of Birth': 'date_of_birth',
    'Course': 'course_name',
    'Training Program': 'course_name',
    'Program': 'course_name'
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
    // Form metadata
    timestamp: new Date(),
    response_id: 'test_response_' + Date.now(),
    form_id: 'test_form',
    
    // Personal Information
    title: 'Mr',
    full_name: 'Test User',
    gender: 'MALE',
    date_of_birth: '1990-01-01',
    phone: '9876543210',
    email_address: 'test@example.com',
    
    // Course Information
    course_name: 'PYTHON',
    batch_initials: 'G28',
    certificate_type: 'student', // student, intern, trainer
    training_mode: 'online',
    
    // Academic Information (for students/interns)
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    gpa: '8.5'
  };
  
  console.log('🧪 Testing API connection with SURE Trust form data...');
  console.log('📊 Test data:', testData);
  
  const result = sendToAPI(testData);
  
  if (result.success) {
    console.log('✅ API connection test successful!');
    console.log('📋 Response:', result.data);
    return true;
  } else {
    console.log('❌ API connection test failed:', result.error);
    return false;
  }
}

/**
 * Test different certificate types
 */
function testAllCertificateTypes() {
  console.log('🧪 Testing all certificate types...');
  
  const baseData = {
    timestamp: new Date(),
    title: 'Mr',
    full_name: 'Test User',
    gender: 'MALE',
    date_of_birth: '1990-01-01',
    phone: '9876543210',
    email_address: 'test@example.com',
    course_name: 'PYTHON',
    training_mode: 'online'
  };
  
  // Test Student Certificate
  console.log('📚 Testing Student Certificate...');
  const studentData = {
    ...baseData,
    certificate_type: 'student',
    batch_initials: 'G28',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    gpa: '8.5',
    response_id: 'test_student_' + Date.now()
  };
  
  const studentResult = sendToAPI(studentData);
  console.log('Student Result:', studentResult.success ? '✅' : '❌', studentResult.success ? studentResult.data : studentResult.error);
  
  // Test Intern Certificate
  console.log('👨‍💼 Testing Intern Certificate...');
  const internData = {
    ...baseData,
    certificate_type: 'intern',
    batch_initials: 'G28',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    gpa: '9.0',
    response_id: 'test_intern_' + Date.now()
  };
  
  const internResult = sendToAPI(internData);
  console.log('Intern Result:', internResult.success ? '✅' : '❌', internResult.success ? internResult.data : internResult.error);
  
  // Test Trainer Certificate
  console.log('👨‍🏫 Testing Trainer Certificate...');
  const trainerData = {
    ...baseData,
    certificate_type: 'trainer',
    response_id: 'test_trainer_' + Date.now()
  };
  
  const trainerResult = sendToAPI(trainerData);
  console.log('Trainer Result:', trainerResult.success ? '✅' : '❌', trainerResult.success ? trainerResult.data : trainerResult.error);
  
  return {
    student: studentResult.success,
    intern: internResult.success,
    trainer: trainerResult.success
  };
}

/**
 * Quick test function to verify the script setup
 */
function quickTest() {
  console.log('🔍 Running quick setup verification...');
  console.log('🌐 API Base URL:', CONFIG.API_BASE_URL);
  console.log('📝 Form Submit Endpoint:', CONFIG.FORM_SUBMIT_ENDPOINT);
  console.log('📊 Sheet ID:', CONFIG.SHEET_ID);
  
  // Test API connection
  return testAPIConnection();
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
