const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const Certificate = require('../models/Certificate');

const router = express.Router();

// Validation schemas
const certificateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  program: Joi.string().min(2).max(200).required(),
  refNo: Joi.string().min(1).max(50).required(),
  issueDate: Joi.date().optional()
});

const verificationSchema = Joi.object({
  dofNo: Joi.string().required()
});

// Generate unique DOF number
const generateDofNo = () => {
  return `DOF-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

// POST /api/certificates - Generate new certificate
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

    const { name, program, refNo, issueDate } = value;

    // Check if refNo already exists
    const existingCert = await Certificate.findOne({ refNo });
    if (existingCert) {
      return res.status(409).json({ 
        error: 'Certificate with this reference number already exists' 
      });
    }

    // Generate unique DOF number
    let dofNo;
    let isUnique = false;
    while (!isUnique) {
      dofNo = generateDofNo();
      const existing = await Certificate.findOne({ dofNo });
      if (!existing) isUnique = true;
    }

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${dofNo}`;

    // Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create certificate
    const certificate = new Certificate({
      refNo,
      dofNo,
      name,
      program,
      issueDate: issueDate || new Date(),
      qrCodeUrl: qrCodeDataUrl,
      metadata: {
        generatedBy: 'system', // In real app, this would be the admin user
        generatedAt: new Date()
      }
    });

    await certificate.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        id: certificate._id,
        refNo: certificate.refNo,
        dofNo: certificate.dofNo,
        name: certificate.name,
        program: certificate.program,
        issueDate: certificate.issueDate,
        qrCodeUrl: certificate.qrCodeUrl,
        verificationUrl
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to generate certificate',
      message: error.message 
    });
  }
});

// GET /api/certificates/verify/:dofNo - Verify certificate
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

    // Find certificate
    const certificate = await Certificate.findOne({ 
      dofNo, 
      isActive: true 
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Certificate not found or inactive'
      });
    }

    // Update verification metadata
    certificate.metadata.lastVerified = new Date();
    certificate.metadata.verificationCount += 1;
    await certificate.save();

    res.status(200).json({
      success: true,
      verified: true,
      message: 'Certificate verified successfully',
      data: {
        refNo: certificate.refNo,
        dofNo: certificate.dofNo,
        name: certificate.name,
        program: certificate.program,
        issueDate: certificate.issueDate,
        verificationCount: certificate.metadata.verificationCount,
        lastVerified: certificate.metadata.lastVerified
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ 
      error: 'Failed to verify certificate',
      message: error.message 
    });
  }
});

// GET /api/certificates/:id - Get certificate by ID
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
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

// GET /api/certificates - Get all certificates (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeUrl'); // Exclude QR code data for list view

    const total = await Certificate.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch certificates',
      message: error.message 
    });
  }
});

// DELETE /api/certificates/:id - Deactivate certificate
router.delete('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    certificate.isActive = false;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to deactivate certificate',
      message: error.message 
    });
  }
});

module.exports = router;
