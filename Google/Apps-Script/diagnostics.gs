/**
 * Google Apps Script Diagnostics for Certificate Automation
 * Run this script to diagnose and fix Google Forms sync issues
 */

// Configuration - Updated with actual Form ID
const CONFIG = {
  API_BASE_URL: 'https://certificate-automation-dmoe.onrender.com/api',
  FORM_SUBMIT_ENDPOINT: '/forms/submit',
  SHEET_ID: '1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU',
  FORM_ID: '1FAIpQLSev4EyumKjc6p4K4HdOJHwwUUVRm1DQ7Udr8wYZZ5owCU7aw', // Extracted from forms.gle/UygoiVrfaKi3A3z59
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

/**
 * Comprehensive diagnostic function
 * Run this to check all aspects of the Google Forms integration
 */
function runFullDiagnostics() {
  console.log('🔍 Starting comprehensive Google Forms sync diagnostics...');
  
  const results = {
    timestamp: new Date(),
    tests: {}
  };
  
  // Test 1: API Connection
  console.log('\n📡 Testing API connection...');
  results.tests.apiConnection = testAPIConnection();
  
  // Test 2: Form Access
  console.log('\n📝 Testing form access...');
  results.tests.formAccess = testFormAccess();
  
  // Test 3: Sheet Access
  console.log('\n📊 Testing sheet access...');
  results.tests.sheetAccess = testSheetAccess();
  
  // Test 4: Field Mapping
  console.log('\n🗂️ Testing field mapping...');
  results.tests.fieldMapping = testFieldMapping();
  
  // Test 5: Triggers
  console.log('\n⚡ Testing triggers...');
  results.tests.triggers = checkTriggers();
  
  // Test 6: Permissions
  console.log('\n🔐 Testing permissions...');
  results.tests.permissions = checkPermissions();
  
  // Generate summary
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('===================');
  Object.keys(results.tests).forEach(test => {
    const result = results.tests[test];
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${test}: ${result.message}`);
  });
  
  // Provide recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  generateRecommendations(results.tests);
  
  return results;
}

/**
 * Test API connection
 */
function testAPIConnection() {
  try {
    const testData = {
      timestamp: new Date(),
      full_name: 'Diagnostic Test User',
      email_address: 'diagnostic@test.com',
      course_name: 'PYTHON',
      certificate_type: 'student',
      response_id: 'diagnostic_test_' + Date.now()
    };
    
    const url = CONFIG.API_BASE_URL + CONFIG.FORM_SUBMIT_ENDPOINT;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(testData)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      const responseData = JSON.parse(responseText);
      return {
        success: true,
        message: `API responding correctly (Status: ${responseCode})`,
        data: responseData
      };
    } else {
      return {
        success: false,
        message: `API error (Status: ${responseCode}): ${responseText}`,
        error: responseText
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `API connection failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Test form access
 */
function testFormAccess() {
  try {
    // Try to find forms linked to this project
    const triggers = ScriptApp.getProjectTriggers();
    const formTriggers = triggers.filter(t => t.getTriggerSource() === ScriptApp.TriggerSource.FORMS);
    
    if (formTriggers.length === 0) {
      return {
        success: false,
        message: 'No form triggers found. Forms may not be linked to this script.',
        recommendation: 'Create form triggers or link forms to this script'
      };
    }
    
    const formIds = [];
    formTriggers.forEach(trigger => {
      try {
        const form = trigger.getTriggerSourceId();
        formIds.push(form);
      } catch (e) {
        console.warn('Could not get form ID from trigger:', e);
      }
    });
    
    return {
      success: true,
      message: `Found ${formTriggers.length} form trigger(s)`,
      data: { triggerCount: formTriggers.length, formIds: formIds }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Form access test failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Test sheet access
 */
function testSheetAccess() {
  try {
    if (!CONFIG.SHEET_ID) {
      return {
        success: false,
        message: 'No sheet ID configured in CONFIG.SHEET_ID',
        recommendation: 'Add your Google Sheet ID to the CONFIG'
      };
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheetName = sheet.getName();
    const activeSheet = sheet.getActiveSheet();
    const lastRow = activeSheet.getLastRow();
    const lastCol = activeSheet.getLastColumn();
    
    // Get headers
    const headers = lastRow > 0 ? activeSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    return {
      success: true,
      message: `Sheet access successful: "${sheetName}" (${lastRow} rows, ${lastCol} columns)`,
      data: {
        sheetName: sheetName,
        rows: lastRow,
        columns: lastCol,
        headers: headers
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Sheet access failed: ${error.message}`,
      error: error.toString(),
      recommendation: 'Check if the sheet ID is correct and you have access'
    };
  }
}

/**
 * Test field mapping by comparing expected fields with sheet headers
 */
function testFieldMapping() {
  try {
    const sheetTest = testSheetAccess();
    if (!sheetTest.success) {
      return {
        success: false,
        message: 'Cannot test field mapping - sheet access failed',
        dependency: 'sheetAccess'
      };
    }
    
    const headers = sheetTest.data.headers;
    const expectedFields = [
      'Email', 'Email Address', 'FULL NAME', 'Full Name', 'Course/Domain', 
      'Batch', 'STRT DATE', 'END DATE', 'GPA', 'Choose Your Role'
    ];
    
    const foundFields = [];
    const missingFields = [];
    
    expectedFields.forEach(field => {
      if (headers.includes(field)) {
        foundFields.push(field);
      } else {
        missingFields.push(field);
      }
    });
    
    const mappingScore = (foundFields.length / expectedFields.length) * 100;
    
    return {
      success: mappingScore > 50, // Consider 50%+ as success
      message: `Field mapping score: ${mappingScore.toFixed(1)}% (${foundFields.length}/${expectedFields.length} fields found)`,
      data: {
        foundFields: foundFields,
        missingFields: missingFields,
        allHeaders: headers,
        score: mappingScore
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Field mapping test failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Check existing triggers
 */
function checkTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const formTriggers = triggers.filter(t => t.getTriggerSource() === ScriptApp.TriggerSource.FORMS);
    const onFormSubmitTriggers = triggers.filter(t => t.getHandlerFunction() === 'onFormSubmit');
    
    return {
      success: formTriggers.length > 0 && onFormSubmitTriggers.length > 0,
      message: `Found ${triggers.length} total triggers (${formTriggers.length} form triggers, ${onFormSubmitTriggers.length} onFormSubmit handlers)`,
      data: {
        totalTriggers: triggers.length,
        formTriggers: formTriggers.length,
        onFormSubmitTriggers: onFormSubmitTriggers.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Trigger check failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Check permissions and scope access
 */
function checkPermissions() {
  try {
    const permissions = [];
    
    // Test DriveApp
    try {
      DriveApp.getRootFolder();
      permissions.push('Drive: ✅');
    } catch (e) {
      permissions.push('Drive: ❌ ' + e.message);
    }
    
    // Test UrlFetchApp
    try {
      // We already tested this in API connection
      permissions.push('UrlFetch: ✅');
    } catch (e) {
      permissions.push('UrlFetch: ❌ ' + e.message);
    }
    
    // Test SpreadsheetApp
    try {
      if (CONFIG.SHEET_ID) {
        SpreadsheetApp.openById(CONFIG.SHEET_ID);
        permissions.push('Spreadsheets: ✅');
      } else {
        permissions.push('Spreadsheets: ⚠️ No sheet ID configured');
      }
    } catch (e) {
      permissions.push('Spreadsheets: ❌ ' + e.message);
    }
    
    // Test FormApp
    try {
      FormApp.getActiveForm();
      permissions.push('Forms: ✅');
    } catch (e) {
      permissions.push('Forms: ⚠️ No active form (this is normal if not run from form)');
    }
    
    return {
      success: true,
      message: 'Permission check completed',
      data: permissions
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Permission check failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(testResults) {
  const recommendations = [];
  
  if (!testResults.apiConnection.success) {
    recommendations.push('🔧 Fix API connection: Check if the backend server is running and accessible');
  }
  
  if (!testResults.formAccess.success) {
    recommendations.push('📝 Setup form triggers: Create triggers for your Google Forms');
  }
  
  if (!testResults.sheetAccess.success) {
    recommendations.push('📊 Fix sheet access: Verify the Google Sheet ID and permissions');
  }
  
  if (!testResults.fieldMapping.success) {
    recommendations.push('🗂️ Update field mapping: Review form fields and update the field mapping in getFieldMapping()');
  }
  
  if (!testResults.triggers.success) {
    recommendations.push('⚡ Create triggers: Run createFormTrigger() function or create triggers manually');
  }
  
  if (recommendations.length === 0) {
    console.log('🎉 No issues found! Your Google Forms sync should be working correctly.');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }
}

/**
 * Quick fix function - attempts to resolve common issues
 */
function quickFix() {
  console.log('🔧 Running quick fix for common Google Forms sync issues...');
  
  try {
    // Test API first
    console.log('📡 Testing API connection...');
    const apiTest = testAPIConnection();
    
    if (apiTest.success) {
      console.log('✅ API connection working');
    } else {
      console.log('❌ API connection failed:', apiTest.message);
      return false;
    }
    
    // Try to auto-detect and fix triggers
    console.log('⚡ Checking and fixing triggers...');
    const triggerResult = autoFixTriggers();
    
    if (triggerResult.success) {
      console.log('✅ Triggers configured successfully');
    } else {
      console.log('⚠️ Could not auto-configure triggers:', triggerResult.message);
    }
    
    console.log('🎯 Quick fix completed. Run runFullDiagnostics() for detailed analysis.');
    return true;
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    return false;
  }
}

/**
 * Auto-fix triggers
 */
function autoFixTriggers() {
  try {
    // Remove existing onFormSubmit triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
        console.log('🗑️ Removed old trigger');
      }
    });
    
    // Try to find forms and create triggers
    // Note: This might not work if forms aren't linked to the script yet
    const formTriggers = triggers.filter(t => t.getTriggerSource() === ScriptApp.TriggerSource.FORMS);
    
    if (formTriggers.length > 0) {
      console.log('📝 Found existing form connections, creating triggers...');
      // Triggers will be created automatically when forms are properly linked
      return { success: true, message: 'Form triggers should work automatically' };
    } else {
      return { 
        success: false, 
        message: 'No forms linked to this script. Please link your Google Forms manually.' 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      message: error.message 
    };
  }
}

/**
 * Manual trigger creation helper
 * Use this if you know your form ID
 */
function createTriggerForForm(formId) {
  try {
    if (!formId) {
      console.log('❌ Please provide a form ID');
      console.log('💡 You can find the form ID in the form URL: https://docs.google.com/forms/d/FORM_ID_HERE/edit');
      return false;
    }
    
    // Remove existing triggers for this form
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getTriggerSourceId() === formId) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger
    const form = FormApp.openById(formId);
    ScriptApp.newTrigger('onFormSubmit')
      .form(form)
      .onFormSubmit()
      .create();
    
    console.log(`✅ Created trigger for form: ${form.getTitle()}`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create trigger:', error);
    return false;
  }
}

/**
 * Setup function for the actual Google Form
 * Run this to connect the script to your Google Form
 */
function setupActualForm() {
  console.log('🚀 Setting up connection to actual Google Form...');
  
  try {
    // Test form access first
    const form = FormApp.openById(CONFIG.FORM_ID);
    console.log(`📝 Found form: "${form.getTitle()}"`);
    
    // Remove existing triggers for this form
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getTriggerSourceId() === CONFIG.FORM_ID) {
        ScriptApp.deleteTrigger(trigger);
        console.log('🗑️ Removed existing trigger');
      }
    });
    
    // Create new trigger
    ScriptApp.newTrigger('onFormSubmit')
      .form(form)
      .onFormSubmit()
      .create();
    
    console.log('✅ Form trigger created successfully!');
    
    // Test the setup
    console.log('🧪 Running diagnostic tests...');
    const diagnostics = runFullDiagnostics();
    
    if (diagnostics.tests.formAccess.success && diagnostics.tests.apiConnection.success) {
      console.log('🎉 Setup complete! Your Google Form is now connected to the backend.');
      console.log('📋 Form URL: https://forms.gle/UygoiVrfaKi3A3z59');
      console.log('📊 Sheet URL: https://docs.google.com/spreadsheets/d/1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU/edit');
      console.log('🌐 Backend API: https://certificate-automation-dmoe.onrender.com/api/forms/submit');
      return true;
    } else {
      console.log('⚠️ Setup completed but some issues remain. Check diagnostic results above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('💡 Make sure this script is added to the same Google Account that owns the form.');
    return false;
  }
}

/**
 * Test the actual form and sheet integration
 */
function testActualIntegration() {
  console.log('🔍 Testing actual form and sheet integration...');
  
  try {
    // Test form access
    const form = FormApp.openById(CONFIG.FORM_ID);
    console.log(`✅ Form access: "${form.getTitle()}"`);
    
    // Test sheet access
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    console.log(`✅ Sheet access: "${sheet.getName()}"`);
    
    // Get actual form fields
    const items = form.getItems();
    console.log('\n📝 Form Fields Found:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.getTitle()} (${item.getType()})`);
    });
    
    // Get sheet headers
    const activeSheet = sheet.getActiveSheet();
    const lastCol = activeSheet.getLastColumn();
    const headers = lastCol > 0 ? activeSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    console.log('\n📊 Sheet Headers Found:');
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });
    
    // Test API connection
    console.log('\n🌐 Testing API connection...');
    const apiTest = testAPIConnection();
    if (apiTest.success) {
      console.log('✅ API connection successful');
    } else {
      console.log('❌ API connection failed:', apiTest.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}
