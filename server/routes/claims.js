const express = require('express');
const CertificateMySQL = require('../models/CertificateMySQL');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/claims/:dofNo - Get certificate claim information (Public)
router.get('/:dofNo', async (req, res) => {
  try {
    const { dofNo } = req.params;

    const result = await CertificateMySQL.getClaimInfo(dofNo);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error getting claim info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificate information'
    });
  }
});

// POST /api/claims/:dofNo - Claim certificate (Authenticated users only)
router.post('/:dofNo', authenticateToken, async (req, res) => {
  try {
    const { dofNo } = req.params;
    const userId = req.user.id;

    const result = await CertificateMySQL.claimByUser(dofNo, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error claiming certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim certificate'
    });
  }
});

module.exports = router;
