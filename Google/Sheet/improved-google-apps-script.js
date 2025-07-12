/**
 * Improved Google Apps Script for Certificate Automation
 * This script handles form submissions from the improved Google Form structure
 */

// Configuration
const CONFIG = {
  BACKEND_URL: 'https://certificate-automation-dmoe.onrender.com/api/forms/submit',
  API_KEY: 'your-api-key-here', // Add your API key
  SPREADSHEET_ID: 'your-spreadsheet-id-here' // Your Google Sheets ID
};

/**
 * Main function triggered on form submission
 */
function onFormSubmit(e) {
  try {
    console.log('Form submitted, processing...');
    
    const form = FormApp.getActiveForm();
    const responses = e.response.getItemResponses();
    
    // Extract form data
    const formData = extractFormData(responses);
    
    // Add metadata
    formData.timestamp = new Date().toISOString();
    formData.responseId = e.response.getId();
    formData.formId = form.getId();
    
    // Determine certificate type based on role selection
    const certificateType = determineCertificateType(formData);
    formData.certificateType = certificateType;
    
    // Validate required fields based on certificate type
    const validation = validateFormData(formData, certificateType);
    if (!validation.isValid) {
      throw new Error('Validation failed: ' + validation.errors.join(', '));
    }
    
    // Send to backend
    const success = sendToBackend(formData);
    
    if (success) {
      // Log to spreadsheet for backup
      logToSpreadsheet(formData);
      
      // Send confirmation email (optional)
      sendConfirmationEmail(formData);
      
      console.log('Form submission processed successfully');
    } else {
      throw new Error('Failed to send data to backend');
    }
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    // You might want to send an alert email to admin here
    sendErrorNotification(error, e);
  }
}

/**
 * Extract and normalize form data
 */
function extractFormData(responses) {
  const formData = {};
  
  responses.forEach(function(response) {
    const question = response.getItem().getTitle();
    const answer = response.getResponse();
    
    // Normalize field names to match database schema
    const fieldName = normalizeFieldName(question);
    formData[fieldName] = answer;
  });
  
  return formData;
}

/**
 * Normalize field names to match database schema
 */
function normalizeFieldName(questionTitle) {
  const fieldMap = {
    'Choose Your Role': 'role',
    'Title': 'title',
    'Full Name': 'full_name',
    'FULL NAME': 'full_name',
    'Email Address': 'email',
    'Phone Number': 'phone',
    'Date of Birth': 'date_of_birth',
    'DATE OF BIRTH': 'date_of_birth',
    'Gender': 'gender',
    'GENDER': 'gender',
    'Course/Domain': 'course_domain',
    'Course/Domain Taught': 'course_domain',
    'Batch': 'batch',
    'Batch/Cohort': 'batch',
    'Batch Conducted': 'batch',
    'Course Start Date': 'start_date',
    'STRT DATE': 'start_date',
    'STRT DATE(FROM)': 'start_date',
    'Training Start Date': 'start_date',
    'Course End Date': 'end_date',
    'END DATE': 'end_date',
    'END DATE(TO)': 'end_date',
    'Training End Date': 'end_date',
    'GPA': 'gpa',
    'GPA/Final Score': 'gpa',
    'Assessment Score': 'assessment_score',
    'Employee ID': 'employee_id',
    'Highest Qualification': 'qualification',
    'Area of Specialization': 'specialization',
    'Years of Experience': 'experience_years',
    'Training Duration (Hours)': 'training_hours',
    'Total Training Hours': 'training_hours',
    'Attendance Percentage': 'attendance_percentage',
    'Number of Participants': 'participants_count',
    'Training Type': 'training_type',
    'Training Mode': 'training_mode',
    'Performance Rating': 'performance_rating',
    'Organization/Institution': 'organization',
    'Additional Comments': 'comments'
  };
  
  return fieldMap[questionTitle] || questionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Determine certificate type based on form data
 */
function determineCertificateType(formData) {
  const role = formData.role || '';
  
  if (role.toLowerCase().includes('student')) {
    return 'student';
  } else if (role.toLowerCase().includes('trainee') || role.toLowerCase().includes('intern')) {
    return 'trainee';
  } else if (role.toLowerCase().includes('trainer')) {
    return 'trainer';
  }
  
  // Fallback: try to determine from other fields
  if (formData.employee_id || formData.qualification) {
    return 'trainer';
  } else if (formData.training_type || formData.organization) {
    return 'trainee';
  } else {
    return 'student';
  }
}

/**
 * Validate form data based on certificate type
 */
function validateFormData(formData, certificateType) {
  const errors = [];
  
  // Common required fields
  const commonRequired = ['full_name', 'email', 'course_domain'];
  
  // Type-specific required fields
  const typeSpecificRequired = {
    student: ['batch', 'start_date', 'end_date', 'gpa'],
    trainee: ['batch', 'start_date', 'end_date', 'training_hours'],
    trainer: ['batch', 'start_date', 'end_date', 'training_hours']
  };
  
  // Check common required fields
  commonRequired.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Check type-specific required fields
  const specificFields = typeSpecificRequired[certificateType] || [];
  specificFields.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      errors.push(`${field} is required for ${certificateType} certificates`);
    }
  });
  
  // Validate email format
  if (formData.email && !isValidEmail(formData.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate date formats and logic
  if (formData.start_date && formData.end_date) {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Send data to backend API
 */
function sendToBackend(formData) {
  try {
    const payload = {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.API_KEY
      },
      'payload': JSON.stringify(formData)
    };
    
    const response = UrlFetchApp.fetch(CONFIG.BACKEND_URL, payload);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200 || responseCode === 201) {
      console.log('Successfully sent data to backend');
      return true;
    } else {
      console.error('Backend returned error:', responseCode, response.getContentText());
      return false;
    }
    
  } catch (error) {
    console.error('Error sending to backend:', error);
    return false;
  }
}

/**
 * Log submission to Google Sheets for backup
 */
function logToSpreadsheet(formData) {
  try {
    if (!CONFIG.SPREADSHEET_ID) {
      console.log('No spreadsheet ID configured, skipping logging');
      return;
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getActiveSheet();
    
    // Create header row if it doesn't exist
    if (sheet.getLastRow() === 0) {
      const headers = Object.keys(formData);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Add data row
    const values = Object.values(formData);
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, values.length).setValues([values]);
    
    console.log('Data logged to spreadsheet');
    
  } catch (error) {
    console.error('Error logging to spreadsheet:', error);
  }
}

/**
 * Send confirmation email to applicant
 */
function sendConfirmationEmail(formData) {
  try {
    if (!formData.email) return;
    
    const subject = `Certificate Application Received - ${formData.certificateType.toUpperCase()}`;
    const body = `
Dear ${formData.full_name},

Thank you for submitting your certificate application!

Application Details:
- Type: ${formData.certificateType.charAt(0).toUpperCase() + formData.certificateType.slice(1)} Certificate
- Course: ${formData.course_domain}
- Batch: ${formData.batch || 'N/A'}
- Submission Time: ${formData.timestamp}

Your application is now being reviewed. You will receive your certificate once it's approved and generated.

You can track your certificate status at: https://certificate-automation-dmoe.onrender.com

Best regards,
SURE Trust Certificate Team
    `;
    
    MailApp.sendEmail(formData.email, subject, body);
    console.log('Confirmation email sent to:', formData.email);
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Send error notification to admin
 */
function sendErrorNotification(error, formResponse) {
  try {
    const adminEmail = 'admin@suretrust.org'; // Change to your admin email
    const subject = 'Certificate Form Submission Error';
    const body = `
Error processing certificate form submission:

Error: ${error.message}
Timestamp: ${new Date().toISOString()}
Response ID: ${formResponse ? formResponse.response.getId() : 'Unknown'}

Please check the form submission manually.
    `;
    
    MailApp.sendEmail(adminEmail, subject, body);
    
  } catch (emailError) {
    console.error('Error sending error notification:', emailError);
  }
}

/**
 * Utility function to validate email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Test function to verify setup
 */
function testSetup() {
  console.log('Testing form integration setup...');
  
  const testData = {
    role: 'Student',
    full_name: 'Test User',
    email: 'test@example.com',
    course_domain: 'Python Programming',
    batch: 'G28',
    start_date: '2024-01-01',
    end_date: '2024-06-01',
    gpa: '8.5',
    certificateType: 'student'
  };
  
  const validation = validateFormData(testData, 'student');
  console.log('Validation result:', validation);
  
  if (validation.isValid) {
    console.log('Setup test passed!');
  } else {
    console.log('Setup test failed:', validation.errors);
  }
}
