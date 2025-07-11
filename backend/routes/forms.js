const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const Joi = require('joi');

// Validation schemas
const studentSchema = Joi.object({
  title: Joi.string().valid('Mr', 'Ms', 'Dr', 'Prof').required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  course: Joi.string().required(),
  batchInitials: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  gpa: Joi.number().min(0).max(10).required(),
  certificateType: Joi.string().valid('student').required()
});

const trainerSchema = Joi.object({
  title: Joi.string().valid('Mr', 'Ms', 'Dr', 'Prof').required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  employeeId: Joi.string().optional(),
  qualification: Joi.string().required(),
  specialization: Joi.string().required(),
  course: Joi.string().required(),
  batchInitials: Joi.string().required(),
  trainingHours: Joi.number().min(1).required(),
  trainingStartDate: Joi.date().required(),
  trainingEndDate: Joi.date().greater(Joi.ref('trainingStartDate')).required(),
  performanceRating: Joi.number().min(0).max(10).optional(),
  certificateType: Joi.string().valid('trainer').required()
});

const traineeSchema = Joi.object({
  title: Joi.string().valid('Mr', 'Ms', 'Dr', 'Prof').required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  organization: Joi.string().required(),
  position: Joi.string().required(),
  course: Joi.string().required(),
  batchInitials: Joi.string().required(),
  trainingType: Joi.string().valid('workshop', 'bootcamp', 'certification', 'seminar').required(),
  trainingStartDate: Joi.date().required(),
  trainingEndDate: Joi.date().greater(Joi.ref('trainingStartDate')).required(),
  trainingDurationHours: Joi.number().min(1).required(),
  attendancePercentage: Joi.number().min(0).max(100).optional(),
  assessmentScore: Joi.number().min(0).max(100).optional(),
  certificateType: Joi.string().valid('trainee').required()
});

// Handle form submissions from Google Forms
router.post('/submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('📝 Received form submission:', formData);

    // Normalize form data (Google Forms might have different field names)
    const normalizedData = normalizeFormData(formData);
    
    // Validate based on certificate type
    let validationResult;
    switch (normalizedData.certificateType) {
      case 'student':
        validationResult = studentSchema.validate(normalizedData);
        break;
      case 'trainer':
        validationResult = trainerSchema.validate(normalizedData);
        break;
      case 'trainee':
        validationResult = traineeSchema.validate(normalizedData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid certificate type' });
    }

    if (validationResult.error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.details 
      });
    }

    // Store in database
    const certificateId = await storeCertificateData(normalizedData);
    
    res.json({
      success: true,
      message: 'Certificate application submitted successfully',
      certificateId: certificateId,
      type: normalizedData.certificateType
    });

  } catch (error) {
    console.error('❌ Error processing form submission:', error);
    res.status(500).json({ 
      error: 'Failed to process form submission',
      message: error.message 
    });
  }
});

// Normalize Google Forms data to our schema
function normalizeFormData(formData) {
  // Map Google Forms field names to our database schema
  const fieldMapping = {
    'Full Name': 'fullName',
    'Email Address': 'email',
    'Email': 'email',
    'Course': 'course',
    'Domain': 'course',
    'Course/Domain': 'course',
    'Batch Initials': 'batchInitials',
    'Start Date': 'startDate',
    'End Date': 'endDate',
    'GPA': 'gpa',
    'Employee ID': 'employeeId',
    'Qualification': 'qualification',
    'Specialization': 'specialization',
    'Training Hours': 'trainingHours',
    'Training Start Date': 'trainingStartDate',
    'Training End Date': 'trainingEndDate',
    'Performance Rating': 'performanceRating',
    'Phone': 'phone',
    'Organization': 'organization',
    'Position': 'position',
    'Training Type': 'trainingType',
    'Training Duration (Hours)': 'trainingDurationHours',
    'Attendance Percentage': 'attendancePercentage',
    'Assessment Score': 'assessmentScore'
  };

  const normalized = {};
  
  // Apply field mapping
  for (const [googleField, dbField] of Object.entries(fieldMapping)) {
    if (formData[googleField] !== undefined) {
      normalized[dbField] = formData[googleField];
    }
  }

  // Copy direct matches
  const directFields = ['title', 'certificateType', 'timestamp', 'responseId'];
  directFields.forEach(field => {
    if (formData[field] !== undefined) {
      normalized[field] = formData[field];
    }
  });

  return normalized;
}

// Store certificate data in appropriate table
async function storeCertificateData(data) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get course and batch IDs
    const courseId = await getCourseId(connection, data.course);
    const batchId = await getBatchId(connection, data.batchInitials, courseId);
    const templateId = await getTemplateId(connection, data.course, data.batchInitials);

    let query, values, tableName;

    switch (data.certificateType) {
      case 'student':
        tableName = 'student_certificates';
        query = `
          INSERT INTO student_certificates 
          (title, full_name, email, course_id, batch_id, duration_months, start_date, end_date, gpa, template_id, qr_code_data) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          data.title, data.fullName, data.email, courseId, batchId, 
          4, data.startDate, data.endDate, data.gpa, templateId, 'PENDING_QR'
        ];
        break;

      case 'trainer':
        tableName = 'trainer_certificates';
        query = `
          INSERT INTO trainer_certificates 
          (title, full_name, email, employee_id, qualification, specialization, course_id, batch_id, 
           training_hours, training_start_date, training_end_date, performance_rating, template_id, qr_code_data) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          data.title, data.fullName, data.email, data.employeeId, data.qualification, 
          data.specialization, courseId, batchId, data.trainingHours, data.trainingStartDate, 
          data.trainingEndDate, data.performanceRating, templateId, 'PENDING_QR'
        ];
        break;

      case 'trainee':
        tableName = 'trainee_certificates';
        query = `
          INSERT INTO trainee_certificates 
          (title, full_name, email, phone, organization, position, course_id, batch_id, 
           training_duration_hours, training_start_date, training_end_date, attendance_percentage, 
           assessment_score, training_type, template_id, qr_code_data) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          data.title, data.fullName, data.email, data.phone, data.organization, 
          data.position, courseId, batchId, data.trainingDurationHours, data.trainingStartDate, 
          data.trainingEndDate, data.attendancePercentage, data.assessmentScore, 
          data.trainingType, templateId, 'PENDING_QR'
        ];
        break;
    }

    const [result] = await connection.execute(query, values);
    
    await connection.commit();
    console.log(`✅ ${data.certificateType} certificate stored with ID: ${result.insertId}`);
    
    return result.insertId;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Helper functions to get IDs
async function getCourseId(connection, courseName) {
  const [rows] = await connection.execute(
    'SELECT course_id FROM courses WHERE course_name = ? OR course_code = ?',
    [courseName, courseName]
  );
  
  if (rows.length === 0) {
    // Create course if not exists
    const [result] = await connection.execute(
      'INSERT INTO courses (course_name, course_code, duration_months, description) VALUES (?, ?, ?, ?)',
      [courseName, courseName.replace(/\s+/g, '_').toUpperCase(), 4, 'Auto-created from form submission']
    );
    return result.insertId;
  }
  
  return rows[0].course_id;
}

async function getBatchId(connection, batchInitials, courseId) {
  const [rows] = await connection.execute(
    'SELECT batch_id FROM batches WHERE batch_initials = ? AND course_id = ?',
    [batchInitials, courseId]
  );
  
  if (rows.length === 0) {
    // Create batch if not exists
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + 4); // 4 months duration
    
    const [result] = await connection.execute(
      'INSERT INTO batches (batch_name, batch_initials, start_date, end_date, course_id) VALUES (?, ?, ?, ?, ?)',
      [`${batchInitials} Batch`, batchInitials, currentDate, endDate, courseId]
    );
    return result.insertId;
  }
  
  return rows[0].batch_id;
}

async function getTemplateId(connection, courseName, batchInitials) {
  const [rows] = await connection.execute(
    'SELECT template_id FROM certificate_templates WHERE course_domain LIKE ? OR graduation_batch = ?',
    [`%${courseName}%`, batchInitials]
  );
  
  if (rows.length > 0) {
    return rows[0].template_id;
  }
  
  // Return default template ID or create one
  return 1; // Default template
}

module.exports = router;
