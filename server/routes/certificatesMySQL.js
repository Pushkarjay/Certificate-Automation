const express = require('express');
const Joi = require('joi');
const CertificateMySQL = require('../models/CertificateMySQL');

const router = express.Router();

// Validation schemas
const certificateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  program: Joi.string().min(2).max(200).required(),
  refNo: Joi.string().min(1).max(50).required(),
  issueDate: Joi.date().optional(),
  certificateType: Joi.string().valid('student', 'trainer').default('student'),
  // Student-specific fields
  trainingDuration: Joi.string().max(50).optional(),
  subjectCourse: Joi.string().max(200).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  gpa: Joi.number().min(0).max(4).precision(2).optional(),
  // Trainer-specific fields
  specialization: Joi.string().max(200).optional(),
  experienceYears: Joi.number().integer().min(0).optional()
});

const verificationSchema = Joi.object({
  dofNo: Joi.string().required()
});

// POST /api/mysql/certificates - Generate new certificate
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = certificateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Check if refNo already exists
    const existingCert = await CertificateMySQL.findByRefNo(value.refNo);
    if (existingCert) {
      return res.status(409).json({ 
        error: 'Certificate with this reference number already exists' 
      });
    }

    // Create certificate
    const certificate = await CertificateMySQL.create(value);

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to generate certificate',
      message: error.message 
    });
  }
});

// GET /api/mysql/certificates/verify/:dofNo - Verify certificate
router.get('/verify/:dofNo', async (req, res) => {
  try {
    const { dofNo } = req.params;

    // Validate DOF number
    const { error } = verificationSchema.validate({ dofNo });
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid DOF number format' 
      });
    }

    // Get client IP and user agent for logging
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Verify certificate
    const result = await CertificateMySQL.verify(dofNo, ipAddress, userAgent);

    if (result.verified) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ 
      error: 'Failed to verify certificate',
      message: error.message 
    });
  }
});

// GET /api/mysql/certificates/:id - Get certificate by ID
router.get('/:id', async (req, res) => {
  try {
    const certificate = await CertificateMySQL.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ 
      error: 'Failed to fetch certificate',
      message: error.message 
    });
  }
});

// GET /api/mysql/certificates - Get all certificates (with pagination and search)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    let result;
    
    if (search) {
      result = await CertificateMySQL.search(search, page, limit);
    } else {
      result = await CertificateMySQL.findAll(page, limit);
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch certificates',
      message: error.message 
    });
  }
});

// DELETE /api/mysql/certificates/:id - Deactivate certificate
router.delete('/:id', async (req, res) => {
  try {
    const certificate = await CertificateMySQL.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    const result = await CertificateMySQL.deactivate(req.params.id);

    res.status(200).json(result);

  } catch (error) {
    console.error('Error deactivating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to deactivate certificate',
      message: error.message 
    });
  }
});

// GET /api/mysql/certificates/stats/:dofNo - Get verification statistics
router.get('/stats/:dofNo', async (req, res) => {
  try {
    const { dofNo } = req.params;
    
    const stats = await CertificateMySQL.getVerificationStats(dofNo);
    
    if (!stats) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch verification statistics',
      message: error.message 
    });
  }
});

module.exports = router;
