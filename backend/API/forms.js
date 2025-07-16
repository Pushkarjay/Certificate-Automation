const express = require('express');
const router = express.Router();
const sheetsDb = require('../services/sheetsDatabase');
const Joi = require('joi');

// Flexible validation schema for form submissions
const formSubmissionSchema = Joi.object({
  // Basic required fields
  full_name: Joi.string().min(2).max(255).required(),
  email_address: Joi.string().email().required(),
  
  // Optional common fields
  title: Joi.string().valid('Mr', 'Ms', 'Dr', 'Prof').optional(),
  phone: Joi.string().optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().optional(),
  
  // Address fields
  address_line1: Joi.string().optional(),
  address_line2: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  postal_code: Joi.string().optional(),
  
  // Educational/Professional
  qualification: Joi.string().optional(),
  institution: Joi.string().optional(),
  specialization: Joi.string().optional(),
  experience_years: Joi.number().optional(),
  organization: Joi.string().optional(),
  position: Joi.string().optional(),
  employee_id: Joi.string().optional(),
  
  // Course information
  course_name: Joi.string().optional(),
  course_domain: Joi.string().optional(),
  batch_initials: Joi.string().optional(),
  batch_name: Joi.string().optional(),
  training_type: Joi.string().optional(),
  training_mode: Joi.string().optional(),
  
  // Dates
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  training_start_date: Joi.date().optional(),
  training_end_date: Joi.date().optional(),
  
  // Performance metrics
  attendance_percentage: Joi.number().min(0).max(100).optional(),
  assessment_score: Joi.number().min(0).max(100).optional(),
  gpa: Joi.number().min(0).max(10).optional(),
  grade: Joi.string().optional(),
  performance_rating: Joi.number().min(0).max(10).optional(),
  training_hours: Joi.number().optional(),
  training_duration_hours: Joi.number().optional(),
  
  // Certificate type
  certificate_type: Joi.string().valid('student', 'trainer', 'trainee').default('student'),
  
  // Metadata fields (optional, for Google Forms integration)
  response_id: Joi.string().optional(),
  form_id: Joi.string().optional(),
  form_source: Joi.string().optional(),
  raw_form_data: Joi.object().optional(),
  additional_data: Joi.object().optional(),
  
  // Timestamp (for Google Forms)
  timestamp: Joi.date().optional()
}).unknown(true); // Allow additional fields

// Handle form submissions from Google Forms
router.post('/submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('📝 Received form submission:', JSON.stringify(formData, null, 2));

    // Normalize Google Forms data to database format
    const normalizedData = normalizeGoogleFormData(formData);
    console.log('🔄 Normalized data:', JSON.stringify(normalizedData, null, 2));
    
    // Validate the normalized data
    const { error, value } = formSubmissionSchema.validate(normalizedData);
    
    if (error) {
      console.error('❌ Validation error:', error.details);
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    console.log('✅ Validation passed, validated data:', JSON.stringify(value, null, 2));

    // Store in database
    const submissionId = await insertFormSubmission(value);
    
    console.log('✅ Form submission stored with ID:', submissionId);
    
    res.json({
      success: true,
      message: 'Form submission received and stored successfully',
      submissionId: submissionId,
      status: 'pending_approval'
    });

  } catch (error) {
    console.error('❌ Error processing form submission:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process form submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Function to normalize Google Forms data
function normalizeGoogleFormData(formData) {
  // Google Forms often sends data with column headers or question text as keys
  // This function maps various possible field names to our database schema
  
  const normalized = {
    timestamp: formData.Timestamp || formData.timestamp || new Date(),
    raw_form_data: formData, // Store original data
    form_source: 'google_forms'
  };

  // Map common field variations
  const fieldMappings = {
    // Name fields
    full_name: ['Name', 'Full Name', 'Student Name', 'Participant Name', 'full_name', 'fullName', 'name'],
    
    // Contact fields
    email_address: ['Email', 'Email Address', 'E-mail', 'email', 'emailAddress', 'email_address'],
    phone: ['Phone', 'Mobile', 'Contact Number', 'Phone Number', 'phone', 'mobile'],
    
    // Personal info
    title: ['Title', 'Salutation', 'Mr/Ms', 'title'],
    date_of_birth: ['Date of Birth', 'DOB', 'Birth Date', 'date_of_birth', 'dob'],
    gender: ['Gender', 'Sex', 'gender'],
    
    // Address
    address_line1: ['Address', 'Address Line 1', 'Street Address', 'address', 'address_line1'],
    city: ['City', 'city'],
    state: ['State', 'Province', 'state'],
    country: ['Country', 'country'],
    postal_code: ['Postal Code', 'ZIP', 'Pin Code', 'postal_code', 'zip'],
    
    // Education/Professional
    qualification: ['Qualification', 'Education', 'Degree', 'qualification'],
    institution: ['Institution', 'College', 'University', 'School', 'institution'],
    organization: ['Organization', 'Company', 'Employer', 'organization'],
    position: ['Position', 'Job Title', 'Designation', 'position'],
    experience_years: ['Experience', 'Years of Experience', 'experience', 'experience_years'],
    
    // Course details
    course_name: ['Course', 'Course Name', 'Training Program', 'Program', 'course', 'course_name'],
    batch_initials: ['Batch', 'Batch Code', 'Batch Number', 'batch', 'batch_initials'],
    training_type: ['Training Type', 'Course Type', 'Program Type', 'training_type'],
    
    // Performance
    gpa: ['GPA', 'CGPA', 'Score', 'Grade Point', 'gpa'],
    attendance_percentage: ['Attendance', 'Attendance %', 'Attendance Percentage', 'attendance'],
    assessment_score: ['Assessment Score', 'Test Score', 'Final Score', 'assessment'],
    
    // Certificate type
    certificate_type: ['Certificate Type', 'Type', 'Category', 'certificate_type']
  };

  // Apply field mappings
  Object.keys(fieldMappings).forEach(dbField => {
    const possibleKeys = fieldMappings[dbField];
    for (const key of possibleKeys) {
      if (formData[key] !== undefined && formData[key] !== '') {
        normalized[dbField] = formData[key];
        break;
      }
    }
  });

  // Set defaults
  if (!normalized.certificate_type) {
    normalized.certificate_type = 'student';
  }

  // Parse dates if they're strings
  ['start_date', 'end_date', 'training_start_date', 'training_end_date', 'date_of_birth'].forEach(dateField => {
    if (normalized[dateField] && typeof normalized[dateField] === 'string') {
      const parsed = new Date(normalized[dateField]);
      if (!isNaN(parsed.getTime())) {
        normalized[dateField] = parsed;
      }
    }
  });

  // Parse numbers
  ['gpa', 'attendance_percentage', 'assessment_score', 'performance_rating', 'training_hours', 'experience_years'].forEach(numField => {
    if (normalized[numField] && typeof normalized[numField] === 'string') {
      const parsed = parseFloat(normalized[numField]);
      if (!isNaN(parsed)) {
        normalized[numField] = parsed;
      }
    }
  });

  return normalized;
}

// Function to insert form submission into Google Sheets
async function insertFormSubmission(data) {
  try {
    console.log('📝 Inserting form submission into Google Sheets...');
    
    // Determine certificate type from data
    const certificateType = data.certificate_type || 'student';
    
    // Ensure required fields have defaults
    if (!data.status) {
      data.status = 'pending';
    }
    if (!data.form_source) {
      data.form_source = 'google_forms';
    }
    
    // Store metadata in additional_data if it doesn't exist
    if (!data.additional_data) {
      const metadata = {};
      if (data.response_id) metadata.response_id = data.response_id;
      if (data.form_id) metadata.form_id = data.form_id;
      if (Object.keys(metadata).length > 0) {
        data.additional_data = JSON.stringify(metadata);
      }
    }
    
    console.log('📝 Inserting data into sheets:', { certificateType, fullName: data.full_name });
    const result = await sheetsDb.insertFormSubmission(data, certificateType);
    return result.id;
    
  } catch (error) {
    console.error('❌ Sheets insert error:', error);
    console.error('❌ Error details:', error.message);
    throw error;
  }
}

// Get all form submissions (for admin)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const certificateType = req.query.type || 'student';
    const search = req.query.search;

    console.log('📋 Fetching form submissions:', { page, limit, status, certificateType, search });

    const result = await sheetsDb.getSubmissions({
      certificateType,
      page,
      limit,
      status,
      search
    });

    res.json({
      submissions: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.totalPages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching form submissions:', error);
    res.status(500).json({ error: 'Failed to fetch form submissions' });
  }
});

// Get single form submission
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📋 Fetching form submission:', id);
    const submission = await sheetsDb.getSubmissionById(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }

    res.json(submission);

  } catch (error) {
    console.error('❌ Error fetching form submission:', error);
    res.status(500).json({ error: 'Failed to fetch form submission' });
  }
});

// Update form submission status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'generated', 'issued'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    console.log('📝 Updating form submission status:', id, status);
    const updatedSubmission = await sheetsDb.updateSubmission(id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    
    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
