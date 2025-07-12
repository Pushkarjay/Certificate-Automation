/**
 * Google Apps Script for Certificate Data Collection
 * This script will automatically process form submissions and store data in your database
 */

// Configuration - Replace with your actual values
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/forms/submit'; // Your backend endpoint
const DATABASE_API_KEY = process.env.DATABASE_API_KEY || 'your-api-key-here'; // For authentication

/**
 * This function is triggered when a form is submitted
 * Configure this as a trigger in Google Apps Script
 */
function onFormSubmit(e) {
  try {
    const form = FormApp.getActiveForm();
    const responses = e.response.getItemResponses();
    
    // Extract form data
    const formData = {};
    
    responses.forEach(function(response) {
      const question = response.getItem().getTitle();
      const answer = response.getResponse();
      formData[question] = answer;
    });
    
    // Add metadata
    formData.timestamp = new Date().toISOString();
    formData.responseId = e.response.getId();
    
    // Determine certificate type based on form responses
    const certificateType = determineCertificateType(formData);
    formData.certificateType = certificateType;
    
    // Send to backend
    const payload = {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DATABASE_API_KEY
      },
      'payload': JSON.stringify(formData)
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, payload);
    
    if (response.getResponseCode() === 200) {
      console.log('Data sent successfully to database');
      
      // Send confirmation email (optional)
      sendConfirmationEmail(formData);
    } else {
      console.error('Failed to send data to database:', response.getContentText());
    }
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    // Send error notification
    sendErrorNotification(error, formData);
  }
}

/**
 * Determine certificate type based on form responses
 */
function determineCertificateType(formData) {
  // Logic to determine if this is a student, trainer, or trainee certificate
  // Based on your form structure
  
  if (formData['Employee ID'] || formData['Qualification']) {
    return 'trainer';
  } else if (formData['Organization'] || formData['Position']) {
    return 'trainee';
  } else {
    return 'student';
  }
}

/**
 * Send confirmation email to the form submitter
 */
function sendConfirmationEmail(formData) {
  try {
    const email = formData['Email'] || formData['Email Address'];
    const name = formData['Full Name'] || formData['Name'];
    
    if (email) {
      const subject = 'Certificate Application Received - SURE Trust';
      const body = `
Dear ${name},

Thank you for submitting your certificate application. We have received your information and your certificate is being processed.

Certificate Details:
- Name: ${name}
- Course: ${formData['Course'] || formData['Domain']}
- Type: ${formData.certificateType}
- Submission Time: ${formData.timestamp}

You will receive your certificate via email once it's ready.

Best regards,
SURE Trust Certificate Team
      `;
      
      MailApp.sendEmail(email, subject, body);
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Send error notification to admin
 */
function sendErrorNotification(error, formData) {
  try {
    const adminEmail = 'admin@suretrust.org'; // Replace with admin email
    const subject = 'Certificate Form Processing Error';
    const body = `
Error processing certificate form submission:

Error: ${error.message}
Stack: ${error.stack}

Form Data: ${JSON.stringify(formData, null, 2)}

Time: ${new Date().toISOString()}
    `;
    
    MailApp.sendEmail(adminEmail, subject, body);
  } catch (emailError) {
    console.error('Error sending error notification:', emailError);
  }
}

/**
 * Test function - Run this to test the webhook connection
 */
function testWebhook() {
  const testData = {
    'Full Name': 'Test User',
    'Email': 'test@example.com',
    'Course': 'Python & Machine Learning',
    'GPA': '7.5',
    'certificateType': 'student',
    'timestamp': new Date().toISOString(),
    'responseId': 'test-response-id'
  };
  
  const payload = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DATABASE_API_KEY
    },
    'payload': JSON.stringify(testData)
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, payload);
    console.log('Test response:', response.getContentText());
  } catch (error) {
    console.error('Test failed:', error);
  }
}
